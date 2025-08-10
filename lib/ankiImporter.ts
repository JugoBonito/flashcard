import { FlashCard, Deck } from '@/types/flashcard';
import { fsrsManager } from './fsrs';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

export class AnkiImporter {
  private progressCallback?: (progress: number) => void;

  constructor(progressCallback?: (progress: number) => void) {
    this.progressCallback = progressCallback;
  }

  async importFromAPKG(file: File, _deckName?: string): Promise<{ deck: Deck; cards: FlashCard[] }> {
    this.updateProgress(5);
    
    try {
      // Load and extract the .apkg file
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      this.updateProgress(15);

      // Check if collection.anki2 exists
      const collectionFile = contents.file('collection.anki2');
      if (!collectionFile) {
        throw new Error('Invalid .apkg file: collection.anki2 not found');
      }

      // For now, we'll extract the data using a different approach
      // since sql.js has browser compatibility issues
      this.updateProgress(25);

      // Get media files
      const mediaFiles = new Map<string, Blob>();
      const mediaJson = contents.file('media');
      if (mediaJson) {
        try {
          const mediaText = await mediaJson.async('text');
          const mediaMapping = JSON.parse(mediaText);
          
          // Extract media files
          for (const [index, filename] of Object.entries(mediaMapping)) {
            const mediaFile = contents.file(index);
            if (mediaFile) {
              const blob = await mediaFile.async('blob');
              mediaFiles.set(filename as string, blob);
            }
          }
        } catch (error) {
          console.warn('Failed to process media files:', error);
        }
      }

      this.updateProgress(40);

      // Since we can't easily parse SQLite in the browser without issues,
      // we'll provide a fallback that suggests exporting as CSV/text from Anki
      throw new Error(
        'Large .apkg files with media are not directly supported. ' +
        'Please export your deck from Anki as:\n' +
        '1. "Notes in Plain Text (.txt)" for simple import, or\n' +
        '2. "Cards in Plain Text (.txt)" with tab separation\n' +
        '3. Or use "Export" → "Text" format from Anki'
      );

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to import .apkg file: ' + String(error));
    }
  }

  // Enhanced CSV importer that can handle Anki's text export format
  async importFromAnkiText(file: File, deckName?: string): Promise<{ deck: Deck; cards: FlashCard[] }> {
    this.updateProgress(10);
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    this.updateProgress(20);

    const cards: FlashCard[] = [];
    const deckId = uuidv4();
    
    // Try to detect the format
    const firstLine = lines[0];
    const isTabSeparated = firstLine.includes('\t');
    
    this.updateProgress(30);

    for (let i = 0; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;

        let front = '';
        let back = '';
        let tags: string[] = [];

        if (isTabSeparated) {
          // Anki's tab-separated format
          const parts = line.split('\t');
          if (parts.length >= 2) {
            front = this.cleanHtml(parts[0]);
            back = this.cleanHtml(parts[1]);
            
            // Tags might be in the 3rd column
            if (parts.length > 2 && parts[2].trim()) {
              tags = parts[2].split(' ').filter(tag => tag.trim());
            }
          }
        } else {
          // Try CSV format
          const parsed = this.parseCSVLine(line);
          front = this.cleanHtml(parsed.front);
          back = this.cleanHtml(parsed.back);
          if (parsed.tags) {
            tags = parsed.tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        }

        if (front && back) {
          const card = fsrsManager.createNewCard(front, back, deckId, tags);
          cards.push(card);
        }

        // Update progress periodically
        if (i % 100 === 0) {
          this.updateProgress(30 + (i / lines.length) * 50);
        }
      } catch (error) {
        console.warn('Failed to parse line:', lines[i], error);
      }
    }

    this.updateProgress(90);

    if (cards.length === 0) {
      throw new Error('No valid cards found in file');
    }

    const now = new Date();
    const deck: Deck = {
      id: deckId,
      name: deckName || `Imported Deck - ${file.name.replace(/\.[^/.]+$/, '')}`,
      description: `Imported from ${file.name} on ${now.toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      cardCount: cards.length,
      newCardCount: cards.length,
      dueCardCount: 0,
      settings: {
        newCardsPerDay: 20,
        maxReviews: 200,
        showAnswerTimer: true,
        autoAdvance: false,
      },
    };

    this.updateProgress(100);
    return { deck, cards };
  }

  private cleanHtml(text: string): string {
    // Remove HTML tags and decode entities
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private parseCSVLine(line: string): { front: string; back: string; tags?: string } {
    // Simple CSV parser that handles quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    
    // Clean up fields
    const cleanedFields = fields.map(field => 
      field.replace(/^"|"$/g, '').replace(/""/g, '"').trim()
    );
    
    return {
      front: cleanedFields[0] || '',
      back: cleanedFields[1] || '',
      tags: cleanedFields[2] || '',
    };
  }

  private updateProgress(progress: number) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}

export const ankiImporter = new AnkiImporter();