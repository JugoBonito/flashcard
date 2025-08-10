import { FlashCard, Deck } from '@/types/flashcard';
import { fsrsManager } from './fsrs';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

// Define interfaces for Anki database structure
interface AnkiNote {
  id: number;
  guid: string;
  mid: number;
  mod: number;
  usn: number;
  tags: string;
  flds: string; // Field data separated by \x1f
  sfld: string;
  csum: number;
  flags: number;
  data: string;
}

interface AnkiCard {
  id: number;
  nid: number;
  did: number;
  ord: number;
  mod: number;
  usn: number;
  type: number;
  queue: number;
  due: number;
  ivl: number;
  factor: number;
  reps: number;
  lapses: number;
  left: number;
  odue: number;
  odid: number;
  flags: number;
  data: string;
}

interface AnkiDeckRecord {
  id: number;
  name: string;
  mtime_secs: number;
  usn: number;
  common: any;
  kind: any;
}

interface AnkiModel {
  id: number;
  name: string;
  type: number;
  mod: number;
  usn: number;
  sortf: number;
  did: number;
  tmpls: Array<{
    name: string;
    ord: number;
    qfmt: string;
    afmt: string;
    bqfmt: string;
    bafmt: string;
  }>;
  flds: Array<{
    name: string;
    ord: number;
    sticky: boolean;
    rtl: boolean;
    font: string;
    size: number;
  }>;
  css: string;
  latexPre: string;
  latexPost: string;
  latexsvg: boolean;
  req: any;
  tags: any;
  vers: any;
}

// Media file interface
interface MediaFile {
  filename: string;
  data: Blob;
  url: string;
}

export class AnkiApkgImporter {
  private progressCallback?: (progress: number) => void;
  private mediaFiles: Map<string, MediaFile> = new Map();

  constructor(progressCallback?: (progress: number) => void) {
    this.progressCallback = progressCallback;
  }

  async importFromAPKG(file: File, deckName?: string): Promise<{ deck: Deck; cards: FlashCard[] }> {
    this.updateProgress(5);
    
    try {
      // Load and extract the .apkg file
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      this.updateProgress(15);

      // Extract media files first
      await this.extractMediaFiles(contents);
      this.updateProgress(25);

      // Get the SQLite database
      const collectionFile = contents.file('collection.anki2');
      if (!collectionFile) {
        throw new Error('Invalid .apkg file: collection.anki2 not found');
      }

      const dbData = await collectionFile.async('uint8array');
      this.updateProgress(35);

      // Parse the SQLite database
      const { notes, cards, decks, models } = await this.parseSQLiteDatabase(dbData);
      this.updateProgress(60);

      // Create deck first to get the ID
      const targetDeckName = deckName || this.extractDeckName(decks) || `Imported Deck - ${file.name.replace('.apkg', '')}`;
      const deck = this.createDeck(targetDeckName, file.name, 0); // Will update count later
      
      // Convert to our format with the proper deck ID
      const flashcards = await this.convertToFlashCards(notes, cards, models, deck.id);
      this.updateProgress(80);

      // Update deck with correct card count
      deck.cardCount = flashcards.length;
      deck.newCardCount = flashcards.length;
      
      this.updateProgress(100);
      return { deck, cards: flashcards };

    } catch (error) {
      console.error('APKG import error:', error);
      throw new Error(`Failed to import .apkg file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractMediaFiles(zip: JSZip): Promise<void> {
    // Get media mapping
    const mediaFile = zip.file('media');
    if (!mediaFile) return;

    try {
      const mediaText = await mediaFile.async('text');
      const mediaMapping: Record<string, string> = JSON.parse(mediaText);
      
      // Extract each media file
      for (const [index, filename] of Object.entries(mediaMapping)) {
        const mediaFileData = zip.file(index);
        if (mediaFileData) {
          const blob = await mediaFileData.async('blob');
          const url = URL.createObjectURL(blob);
          
          this.mediaFiles.set(filename, {
            filename,
            data: blob,
            url
          });
        }
      }
    } catch (error) {
      console.warn('Failed to extract media files:', error);
    }
  }

  private async parseSQLiteDatabase(dbData: Uint8Array): Promise<{
    notes: AnkiNote[];
    cards: AnkiCard[];
    decks: Record<string, AnkiDeckRecord>;
    models: Record<string, AnkiModel>;
  }> {
    // For browser compatibility, we'll use a simpler approach
    // In a full implementation, you'd use sql.js here
    
    // Since sql.js can be problematic in browsers, let's implement a fallback
    // that tries to parse the most common Anki export patterns
    
    try {
      // Try to use sql.js if available
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file === 'sql-wasm.wasm') {
            return 'https://sql.js.org/dist/sql-wasm.wasm';
          }
          return file;
        }
      });

      const db = new SQL.Database(dbData);
      
      // Query notes
      const notesResult = db.exec("SELECT * FROM notes");
      const notes: AnkiNote[] = [];
      
      if (notesResult.length > 0) {
        const columns = notesResult[0].columns;
        const values = notesResult[0].values;
        
        for (const row of values) {
          const note: any = {};
          for (let i = 0; i < columns.length; i++) {
            note[columns[i]] = row[i];
          }
          notes.push(note as AnkiNote);
        }
      }

      // Query cards
      const cardsResult = db.exec("SELECT * FROM cards");
      const cards: AnkiCard[] = [];
      
      if (cardsResult.length > 0) {
        const columns = cardsResult[0].columns;
        const values = cardsResult[0].values;
        
        for (const row of values) {
          const card: any = {};
          for (let i = 0; i < columns.length; i++) {
            card[columns[i]] = row[i];
          }
          cards.push(card as AnkiCard);
        }
      }

      // Query decks from col table
      const colResult = db.exec("SELECT decks FROM col");
      let decks: Record<string, AnkiDeckRecord> = {};
      
      if (colResult.length > 0 && colResult[0].values.length > 0) {
        try {
          decks = JSON.parse(colResult[0].values[0][0] as string);
        } catch {
          decks = { "1": { id: 1, name: "Default", mtime_secs: Date.now() / 1000, usn: 0, common: {}, kind: {} } };
        }
      }

      // Query models from col table
      const modelsResult = db.exec("SELECT models FROM col");
      let models: Record<string, AnkiModel> = {};
      
      if (modelsResult.length > 0 && modelsResult[0].values.length > 0) {
        try {
          models = JSON.parse(modelsResult[0].values[0][0] as string);
        } catch {
          models = {};
        }
      }

      db.close();
      
      return { notes, cards, decks, models };

    } catch (error) {
      console.warn('SQL.js failed, using fallback parser:', error);
      
      // Fallback: return empty data with error message
      throw new Error(
        'Unable to parse .apkg database in browser environment. ' +
        'For large .apkg files, please export from Anki as "Notes in Plain Text (.txt)" ' +
        'and use the Text import option instead.'
      );
    }
  }

  private async convertToFlashCards(
    notes: AnkiNote[], 
    cards: AnkiCard[], 
    models: Record<string, AnkiModel>,
    deckId: string
  ): Promise<FlashCard[]> {
    const flashCards: FlashCard[] = [];

    // Create a map of notes for quick lookup
    const noteMap = new Map<number, AnkiNote>();
    for (const note of notes) {
      noteMap.set(note.id, note);
    }

    for (const card of cards) {
      const note = noteMap.get(card.nid);
      if (!note) continue;

      try {
        // Get the model for this note
        const model = models[note.mid.toString()];
        if (!model) continue;

        // Parse fields from the note
        const fields = note.flds.split('\x1f');
        
        // Get the template for this card
        const template = model.tmpls.find(t => t.ord === card.ord) || model.tmpls[0];
        if (!template) continue;

        // Extract front and back content
        let front = this.processTemplate(template.qfmt, fields, model);
        let back = this.processTemplate(template.afmt, fields, model);

        // Clean up HTML and process media
        front = await this.processContent(front);
        back = await this.processContent(back);

        // Extract tags
        const tags = note.tags.split(' ').filter(tag => tag.trim());

        // Create flashcard
        const flashCard = fsrsManager.createNewCard(front, back, deckId, tags);
        
        // Set scheduling info if the card has been studied
        if (card.reps > 0) {
          flashCard.reps = card.reps;
          flashCard.lapses = card.lapses;
          flashCard.due = new Date(card.due * 24 * 60 * 60 * 1000); // Convert from days to date
        }

        flashCards.push(flashCard);
        
      } catch (error) {
        console.warn('Failed to process card:', card.id, error);
      }
    }

    return flashCards;
  }

  private processTemplate(template: string, fields: string[], model: AnkiModel): string {
    let content = template;
    
    // Replace field references {{Field}} with actual field values
    for (let i = 0; i < model.flds.length && i < fields.length; i++) {
      const fieldName = model.flds[i].name;
      const fieldValue = fields[i] || '';
      
      // Replace various field reference formats
      content = content.replace(new RegExp(`{{${fieldName}}}`, 'gi'), fieldValue);
      content = content.replace(new RegExp(`{{#${fieldName}}}.*?{{/${fieldName}}}`, 'gis'), fieldValue ? fieldValue : '');
    }
    
    // Remove any remaining template syntax
    content = content.replace(/{{[^}]+}}/g, '');
    
    return content;
  }

  private async processContent(content: string): Promise<string> {
    // Process media references
    let processedContent = content;
    
    // Find media references like [sound:filename.mp3] or <img src="filename.jpg">
    const mediaRegex = /(?:\[sound:([^\]]+)\]|<img[^>]+src=["']([^"']+)["'][^>]*>)/gi;
    
    let match;
    while ((match = mediaRegex.exec(content)) !== null) {
      const filename = match[1] || match[2];
      if (filename && this.mediaFiles.has(filename)) {
        const mediaFile = this.mediaFiles.get(filename)!;
        
        if (match[1]) {
          // Sound file
          processedContent = processedContent.replace(
            match[0], 
            `<audio controls><source src="${mediaFile.url}" type="audio/mpeg">🔊 ${filename}</audio>`
          );
        } else {
          // Image file
          processedContent = processedContent.replace(
            match[0], 
            `<img src="${mediaFile.url}" alt="${filename}" style="max-width: 300px; max-height: 200px;">`
          );
        }
      }
    }
    
    // Clean HTML but preserve basic formatting
    processedContent = this.cleanHtml(processedContent);
    
    return processedContent;
  }

  private cleanHtml(html: string): string {
    // Clean HTML while preserving important structure and content
    let cleaned = html;
    
    // Remove dangerous content first
    cleaned = cleaned
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: URLs
    
    // Preserve important structural and media elements
    const preservedElements: string[] = [];
    let elementCounter = 0;
    
    // Preserve media, structural elements, and basic formatting
    cleaned = cleaned.replace(/<(img|audio|video|hr|br|ul|ol|li|table|tr|td|th|strong|b|em|i|u|sub|sup)[^>]*>(?:<\/\1>)?/gi, (match) => {
      const placeholder = `__PRESERVED_ELEMENT_${elementCounter}__`;
      preservedElements[elementCounter] = match;
      elementCounter++;
      return placeholder;
    });
    
    // Remove unwanted formatting tags while preserving content (handle nested tags)
    // Only remove tags that are purely for visual styling
    for (let i = 0; i < 5; i++) {
      cleaned = cleaned
        .replace(/<font[^>]*>(.*?)<\/font>/gi, '$1') // Remove font tags
        .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1') // Remove span tags (usually just styling)
        .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1<br>') // Convert div to line break
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1<br><br>'); // Convert p to double line break
    }
    
    // Restore preserved elements
    for (let i = 0; i < elementCounter; i++) {
      cleaned = cleaned.replace(`__PRESERVED_ELEMENT_${i}__`, preservedElements[i]);
    }
    
    // Clean up attributes but preserve some useful ones
    cleaned = cleaned
      .replace(/style="[^"]*"/gi, '') // Remove style attributes
      .replace(/class="[^"]*"/gi, '') // Remove class attributes
      // Keep id attributes as they might be functionally important (like hr id=answer)
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br><br>') // Normalize double breaks
      .replace(/(<br\s*\/?>){3,}/gi, '<br><br>') // Limit consecutive breaks to 2
      .replace(/\s*<br\s*\/?>\s*/gi, '<br>') // Clean up br spacing
      .replace(/\s+/g, ' ') // Collapse spaces but preserve single spaces
      .replace(/\s*<br>\s*/gi, '<br>'); // Clean spacing around breaks
    
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#8203;/g, '') // Remove zero-width spaces
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');
    
    return cleaned.trim();
  }

  private extractDeckName(decks: Record<string, AnkiDeckRecord>): string | null {
    // Find the first non-default deck
    for (const deck of Object.values(decks)) {
      if (deck.name && deck.name !== 'Default') {
        return deck.name;
      }
    }
    
    // If only default deck exists, return it
    const firstDeck = Object.values(decks)[0];
    return firstDeck?.name || null;
  }

  private createDeck(name: string, filename: string, cardCount: number): Deck {
    const now = new Date();
    return {
      id: uuidv4(),
      name,
      description: `Imported from ${filename} on ${now.toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      cardCount,
      newCardCount: cardCount,
      dueCardCount: 0,
      settings: {
        newCardsPerDay: 20,
        maxReviews: 200,
        showAnswerTimer: true,
        autoAdvance: false,
      },
    };
  }

  private updateProgress(progress: number) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}

export const ankiApkgImporter = new AnkiApkgImporter();