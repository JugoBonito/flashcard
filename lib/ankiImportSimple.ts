import { FlashCard, Deck } from '@/types/flashcard';
import { fsrsManager } from './fsrs';
import { v4 as uuidv4 } from 'uuid';
import { State } from 'ts-fsrs';

export interface AnkiCSVCard {
  front: string;
  back: string;
  tags?: string;
}

export class SimpleAnkiImporter {
  // Import from CSV format (exported from Anki)
  async importFromCSV(file: File, deckName?: string): Promise<{ deck: Deck; cards: FlashCard[] }> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    // Detect if first line is a header
    const hasHeader = lines[0].toLowerCase().includes('front') || lines[0].toLowerCase().includes('question');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    const cards: FlashCard[] = [];
    const deckId = uuidv4();
    
    for (const line of dataLines) {
      try {
        const parsed = this.parseCSVLine(line);
        if (parsed.front && parsed.back) {
          const tags = parsed.tags ? parsed.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const card = fsrsManager.createNewCard(parsed.front, parsed.back, deckId, tags);
          cards.push(card);
        }
      } catch (error) {
        console.warn('Failed to parse line:', line, error);
      }
    }

    if (cards.length === 0) {
      throw new Error('No valid cards found in file');
    }

    const now = new Date();
    const deck: Deck = {
      id: deckId,
      name: deckName || `Imported Deck - ${file.name}`,
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

    return { deck, cards };
  }

  // Import from simple text format
  async importFromText(file: File, deckName?: string): Promise<{ deck: Deck; cards: FlashCard[] }> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const cards: FlashCard[] = [];
    const deckId = uuidv4();
    
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        const front = lines[i].trim();
        const back = lines[i + 1].trim();
        
        if (front && back) {
          const card = fsrsManager.createNewCard(front, back, deckId, []);
          cards.push(card);
        }
      }
    }

    if (cards.length === 0) {
      throw new Error('No valid cards found. Make sure each line alternates between question and answer.');
    }

    const now = new Date();
    const deck: Deck = {
      id: deckId,
      name: deckName || `Text Import - ${file.name}`,
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

    return { deck, cards };
  }

  // Parse JSON format (exported from this app or similar)
  async importFromJSON(file: File): Promise<{ deck: Deck; cards: FlashCard[] }> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.deck || !data.cards) {
      throw new Error('Invalid JSON format. Expected deck and cards properties.');
    }

    // Convert date strings back to Date objects
    const deck: Deck = {
      ...data.deck,
      id: uuidv4(), // Generate new ID to avoid conflicts
      createdAt: new Date(data.deck.createdAt),
      updatedAt: new Date(),
    };

    const deckId = deck.id;
    const cards: FlashCard[] = data.cards.map((cardData: any) => ({
      ...cardData,
      id: uuidv4(), // Generate new ID
      deckId: deckId, // Update deck reference
      due: new Date(cardData.due),
      createdAt: new Date(cardData.createdAt),
      updatedAt: new Date(),
      last_review: cardData.last_review ? new Date(cardData.last_review) : undefined,
    }));

    deck.cardCount = cards.length;
    deck.newCardCount = cards.filter(card => card.state === State.New).length;
    deck.dueCardCount = cards.filter(card => card.due <= new Date()).length;

    return { deck, cards };
  }

  private parseCSVLine(line: string): AnkiCSVCard {
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
}

export const ankiImporter = new SimpleAnkiImporter();