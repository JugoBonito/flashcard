import JSZip from 'jszip';
import initSqlJs, { Database } from 'sql.js';
import { FlashCard, Deck, AnkiCard, AnkiNote, AnkiModel, MediaFile } from '@/types/flashcard';
import { fsrsManager } from './fsrs';
import { v4 as uuidv4 } from 'uuid';

export class AnkiImporter {
  private db: Database | null = null;
  private media: Record<string, string> = {};
  private mediaFiles: Record<string, Uint8Array> = {};

  async importApkgFile(file: File): Promise<{ deck: Deck; cards: FlashCard[] }> {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: () => `/sql-wasm.wasm`
      });

      // Read and unzip the APKG file
      const zip = await JSZip.loadAsync(file);
      
      // Extract collection.anki2 database
      const collectionFile = zip.file('collection.anki2');
      if (!collectionFile) {
        throw new Error('Invalid APKG file: missing collection.anki2');
      }

      const dbData = await collectionFile.async('uint8array');
      this.db = new SQL.Database(dbData);

      // Extract media mappings
      const mediaFile = zip.file('media');
      if (mediaFile) {
        const mediaJson = await mediaFile.async('text');
        this.media = JSON.parse(mediaJson);
      }

      // Extract media files
      for (const [filename, originalName] of Object.entries(this.media)) {
        const file = zip.file(filename);
        if (file) {
          this.mediaFiles[originalName] = await file.async('uint8array');
        }
      }

      // Parse deck and cards
      const deck = this.extractDeck();
      const cards = this.extractCards();

      this.db.close();
      
      return { deck, cards };
    } catch (error) {
      console.error('Error importing APKG file:', error);
      throw new Error(`Failed to import APKG file: ${error}`);
    }
  }

  private extractDeck(): Deck {
    if (!this.db) throw new Error('Database not initialized');

    // Get deck information from the decks table
    const deckQuery = `SELECT * FROM decks LIMIT 1`;
    const result = this.db.exec(deckQuery);
    
    let deckName = 'Imported Deck';
    const deckId = uuidv4();
    
    if (result.length > 0 && result[0].values.length > 0) {
      const deckData = result[0].values[0];
      // Anki stores deck info as JSON in the decks table
      try {
        const deckInfo = JSON.parse(deckData[1] as string);
        deckName = deckInfo.name || deckName;
      } catch {
        // Fallback if parsing fails
      }
    }

    const now = new Date();
    return {
      id: deckId,
      name: deckName,
      description: `Imported from Anki on ${now.toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      cardCount: 0,
      newCardCount: 0,
      dueCardCount: 0,
      settings: {
        newCardsPerDay: 20,
        maxReviews: 200,
        showAnswerTimer: true,
        autoAdvance: false,
      },
    };
  }

  private extractCards(): FlashCard[] {
    if (!this.db) throw new Error('Database not initialized');

    const cards: FlashCard[] = [];
    
    // Get notes and their associated cards
    const notesQuery = `SELECT * FROM notes`;
    const cardsQuery = `SELECT * FROM cards`;
    const modelsQuery = `SELECT * FROM col`;
    
    const notesResult = this.db.exec(notesQuery);
    const cardsResult = this.db.exec(cardsQuery);
    const modelsResult = this.db.exec(modelsQuery);
    
    if (notesResult.length === 0 || cardsResult.length === 0) {
      return cards;
    }

    // Parse models to understand field structure
    let models: Record<string, AnkiModel> = {};
    if (modelsResult.length > 0 && modelsResult[0].values.length > 0) {
      try {
        const colData = JSON.parse(modelsResult[0].values[0][8] as string);
        models = colData.models || {};
      } catch (error) {
        console.warn('Could not parse models:', error);
      }
    }

    // Create a map of notes
    const notesMap: Record<number, AnkiNote> = {};
    notesResult[0].values.forEach((noteRow: any[]) => {
      const note: AnkiNote = {
        id: noteRow[0] as number,
        guid: noteRow[1] as string,
        mid: noteRow[2] as number,
        mod: noteRow[3] as number,
        usn: noteRow[4] as number,
        tags: noteRow[5] as string,
        flds: noteRow[6] as string,
        sfld: noteRow[7] as string,
        csum: noteRow[8] as number,
        flags: noteRow[9] as number,
        data: noteRow[10] as string,
      };
      notesMap[note.id] = note;
    });

    // Process cards
    cardsResult[0].values.forEach((cardRow: any[]) => {
      const ankiCard: AnkiCard = {
        id: cardRow[0] as number,
        nid: cardRow[1] as number,
        did: cardRow[2] as number,
        ord: cardRow[3] as number,
        mod: cardRow[4] as number,
        usn: cardRow[5] as number,
        type: cardRow[6] as number,
        queue: cardRow[7] as number,
        due: cardRow[8] as number,
        ivl: cardRow[9] as number,
        factor: cardRow[10] as number,
        reps: cardRow[11] as number,
        lapses: cardRow[12] as number,
        left: cardRow[13] as number,
        odue: cardRow[14] as number,
        odid: cardRow[15] as number,
        flags: cardRow[16] as number,
        data: cardRow[17] as string,
      };

      const note = notesMap[ankiCard.nid];
      if (note) {
        const flashCard = this.convertAnkiCardToFlashCard(ankiCard, note, models);
        cards.push(flashCard);
      }
    });

    return cards;
  }

  private convertAnkiCardToFlashCard(
    ankiCard: AnkiCard, 
    note: AnkiNote, 
    _models: Record<string, AnkiModel>
  ): FlashCard {
    const fields = note.flds.split('\x1f'); // Anki uses \x1f as field separator
    
    let front = fields[0] || 'Front';
    let back = fields[1] || 'Back';
    
    // Clean up HTML and handle media references
    front = this.cleanHtml(front);
    back = this.cleanHtml(back);
    
    // Extract media files referenced in the card
    const mediaFiles = this.extractMediaFromContent(front + back);
    
    // Create new FlashCard using FSRS
    const baseCard = fsrsManager.createNewCard(front, back, '', note.tags.split(' ').filter(Boolean));
    
    // Apply Anki scheduling data if the card has been reviewed
    const now = new Date();
    let due = now;
    
    if (ankiCard.type > 0 && ankiCard.ivl > 0) {
      // Convert Anki due date (days since epoch) to actual date
      due = new Date(Date.now() + (ankiCard.due - Math.floor(Date.now() / 86400000)) * 86400000);
    }
    
    return {
      ...baseCard,
      id: uuidv4(),
      due,
      reps: ankiCard.reps,
      lapses: ankiCard.lapses,
      media: mediaFiles,
      createdAt: new Date(ankiCard.mod * 1000),
      updatedAt: new Date(ankiCard.mod * 1000),
    };
  }

  private cleanHtml(content: string): string {
    // Remove HTML tags but preserve basic formatting
    return content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  private extractMediaFromContent(content: string): MediaFile[] {
    const mediaFiles: MediaFile[] = [];
    const mediaRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const audioRegex = /\[sound:([^\]]+)\]/gi;
    
    let match;
    
    // Extract images
    while ((match = mediaRegex.exec(content)) !== null) {
      const filename = match[1];
      if (this.mediaFiles[filename]) {
        mediaFiles.push({
          filename,
          data: this.mediaFiles[filename],
          type: 'image',
        });
      }
    }
    
    // Extract audio files
    while ((match = audioRegex.exec(content)) !== null) {
      const filename = match[1];
      if (this.mediaFiles[filename]) {
        mediaFiles.push({
          filename,
          data: this.mediaFiles[filename],
          type: 'audio',
        });
      }
    }
    
    return mediaFiles;
  }
}

export class AnkiExporter {
  async exportToApkg(deck: Deck, cards: FlashCard[]): Promise<Blob> {
    // Initialize SQL.js
    const SQL = await initSqlJs({
      locateFile: () => `/sql-wasm.wasm`
    });

    // Create new database with Anki schema
    const db = new SQL.Database();
    
    // Create Anki tables
    this.createAnkiTables(db);
    
    // Insert deck and card data
    this.insertDeckData(db, deck, cards);
    
    // Export database
    const dbData = db.export();
    db.close();
    
    // Create ZIP file
    const zip = new JSZip();
    zip.file('collection.anki2', dbData);
    
    // Add media files and media mapping
    const mediaMap: Record<string, string> = {};
    let mediaIndex = 0;
    
    cards.forEach(card => {
      if (card.media) {
        card.media.forEach(media => {
          const key = mediaIndex.toString();
          zip.file(key, media.data);
          mediaMap[key] = media.filename;
          mediaIndex++;
        });
      }
    });
    
    zip.file('media', JSON.stringify(mediaMap));
    
    // Generate APKG file
    return zip.generateAsync({ type: 'blob' });
  }

  private createAnkiTables(db: Database): void {
    // Simplified Anki schema - only essential tables
    db.run(`
      CREATE TABLE col (
        id INTEGER PRIMARY KEY,
        crt INTEGER NOT NULL,
        mod INTEGER NOT NULL,
        scm INTEGER NOT NULL,
        ver INTEGER NOT NULL,
        dty INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        ls INTEGER NOT NULL,
        conf TEXT NOT NULL,
        models TEXT NOT NULL,
        decks TEXT NOT NULL,
        dconf TEXT NOT NULL,
        tags TEXT NOT NULL
      )
    `);
    
    db.run(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY,
        guid TEXT NOT NULL,
        mid INTEGER NOT NULL,
        mod INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        tags TEXT NOT NULL,
        flds TEXT NOT NULL,
        sfld TEXT NOT NULL,
        csum INTEGER NOT NULL,
        flags INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `);
    
    db.run(`
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY,
        nid INTEGER NOT NULL,
        did INTEGER NOT NULL,
        ord INTEGER NOT NULL,
        mod INTEGER NOT NULL,
        usn INTEGER NOT NULL,
        type INTEGER NOT NULL,
        queue INTEGER NOT NULL,
        due INTEGER NOT NULL,
        ivl INTEGER NOT NULL,
        factor INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        lapses INTEGER NOT NULL,
        left INTEGER NOT NULL,
        odue INTEGER NOT NULL,
        odid INTEGER NOT NULL,
        flags INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `);
  }

  private insertDeckData(db: Database, _deck: Deck, cards: FlashCard[]): void {
    const now = Date.now();
    const nowSec = Math.floor(now / 1000);
    
    // Insert collection metadata
    db.run(`
      INSERT INTO col VALUES (
        1, ?, ?, ?, 11, 0, -1, ?,
        '{"nextPos": 1, "estTimes": true, "activeDecks": [1], "sortType": "noteFld", "timeLim": 0, "sortBackwards": false, "addToCur": true, "curDeck": 1, "newBury": true, "newSpread": 0, "dueCounts": true, "curModel": "1", "collapseTime": 1200}',
        '{"1": {"id": 1, "name": "Basic", "type": 0, "flds": [{"name": "Front", "ord": 0, "sticky": false, "rtl": false, "font": "Arial", "size": 20}, {"name": "Back", "ord": 1, "sticky": false, "rtl": false, "font": "Arial", "size": 20}], "tmpls": [{"name": "Card 1", "ord": 0, "qfmt": "{{Front}}", "afmt": "{{FrontSide}}<hr id=answer>{{Back}}", "bqfmt": "", "bafmt": ""}], "css": ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }"}}',
        '{"1": {"id": 1, "name": "Default", "extendRev": 50, "usn": 0, "collapsed": false, "newToday": [0, 0], "revToday": [0, 0], "lrnToday": [0, 0], "timeToday": [0, 0], "conf": 1, "desc": ""}}',
        '{"1": {"id": 1, "name": "Default", "new": {"perDay": 20, "delays": [1, 10], "separate": true, "tags": "", "ord": 1, "ints": [1, 4, 7]}, "lapse": {"delays": [10], "mult": 0, "minInt": 1, "leechFails": 8, "leechAction": 0}, "rev": {"perDay": 100, "ease4": 1.3, "fuzz": 0.05, "minSpace": 1, "ivlFct": 1, "maxIvl": 36500}, "timer": 0, "maxTaken": 60, "usn": 0, "new": {"separate": true}, "autoplay": true, "replayq": true}}',
        '{}'
      )
    `, [nowSec, nowSec, nowSec, nowSec]);
    
    // Insert notes and cards
    cards.forEach((card, index) => {
      const noteId = index + 1;
      const cardId = index + 1;
      
      // Insert note
      db.run(`
        INSERT INTO notes VALUES (?, ?, 1, ?, -1, ?, ?, ?, 0, 0, '')
      `, [
        noteId,
        this.generateGuid(),
        nowSec,
        card.tags.join(' '),
        `${card.front}\x1f${card.back}`,
        card.front.substring(0, 50)
      ]);
      
      // Convert due date to Anki format
      const dueDate = Math.floor(card.due.getTime() / 86400000);
      
      // Insert card
      db.run(`
        INSERT INTO cards VALUES (?, ?, 1, 0, ?, -1, 2, 2, ?, ?, 2500, ?, ?, 0, 0, 0, 0, '')
      `, [
        cardId,
        noteId,
        nowSec,
        dueDate,
        card.scheduled_days,
        card.reps,
        card.lapses
      ]);
    });
  }

  private generateGuid(): string {
    return uuidv4().replace(/-/g, '');
  }
}

export const ankiImporter = new AnkiImporter();
export const ankiExporter = new AnkiExporter();