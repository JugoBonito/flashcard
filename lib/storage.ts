import { FlashCard, Deck, ReviewSession, StudyStats } from '@/types/flashcard';
import { State } from 'ts-fsrs';

const STORAGE_KEYS = {
  DECKS: 'flashcard_decks',
  CARDS: 'flashcard_cards',
  SESSIONS: 'flashcard_sessions',
  STATS: 'flashcard_stats',
  SETTINGS: 'flashcard_settings',
} as const;

export class Storage {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  static getDecks(): Deck[] {
    if (!this.isClient()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DECKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveDecks(decks: Deck[]): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  }

  static getDeck(id: string): Deck | null {
    const decks = this.getDecks();
    return decks.find(deck => deck.id === id) || null;
  }

  static saveDeck(deck: Deck): void {
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === deck.id);
    if (index >= 0) {
      decks[index] = deck;
    } else {
      decks.push(deck);
    }
    this.saveDecks(decks);
  }

  static deleteDeck(id: string): void {
    const decks = this.getDecks();
    const filtered = decks.filter(deck => deck.id !== id);
    this.saveDecks(filtered);
    
    // Also delete all cards in the deck
    const cards = this.getCards();
    const filteredCards = cards.filter(card => card.deckId !== id);
    this.saveCards(filteredCards);
  }

  static getCards(deckId?: string): FlashCard[] {
    if (!this.isClient()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
      const cards: FlashCard[] = stored ? JSON.parse(stored, (key, value) => {
        if (key === 'due' || key === 'createdAt' || key === 'updatedAt') {
          return new Date(value);
        }
        return value;
      }) : [];
      
      return deckId ? cards.filter(card => card.deckId === deckId) : cards;
    } catch {
      return [];
    }
  }

  static saveCards(cards: FlashCard[]): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }

  static getCard(id: string): FlashCard | null {
    const cards = this.getCards();
    return cards.find(card => card.id === id) || null;
  }

  static saveCard(card: FlashCard): void {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === card.id);
    if (index >= 0) {
      cards[index] = card;
    } else {
      cards.push(card);
    }
    this.saveCards(cards);
  }

  static deleteCard(id: string): void {
    const cards = this.getCards();
    const filtered = cards.filter(card => card.id !== id);
    this.saveCards(filtered);
  }

  static getDueCards(deckId?: string): FlashCard[] {
    const cards = this.getCards(deckId);
    const now = new Date();
    return cards.filter(card => card.due <= now);
  }

  static getNewCards(deckId?: string): FlashCard[] {
    const cards = this.getCards(deckId);
    return cards.filter(card => card.state === State.New);
  }

  static getSessions(): ReviewSession[] {
    if (!this.isClient()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored, (key, value) => {
        if (key === 'startTime' || key === 'endTime' || key === 'timestamp') {
          return value ? new Date(value) : undefined;
        }
        return value;
      }) : [];
    } catch {
      return [];
    }
  }

  static saveSession(session: ReviewSession): void {
    if (!this.isClient()) return;
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  static getStats(): StudyStats {
    if (!this.isClient()) {
      return {
        totalCards: 0,
        dueCards: 0,
        newCards: 0,
        learningCards: 0,
        matureCards: 0,
        suspendedCards: 0,
        buriedCards: 0,
        streak: 0,
        dailyGoal: 10,
        todayStudied: 0,
      };
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STATS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fall through to default
    }

    // Calculate stats from current data
    const cards = this.getCards();
    const dueCards = this.getDueCards();
    const newCards = this.getNewCards();
    
    return {
      totalCards: cards.length,
      dueCards: dueCards.length,
      newCards: newCards.length,
      learningCards: cards.filter(c => c.state === State.Learning || c.state === State.Relearning).length,
      matureCards: cards.filter(c => c.state === State.Review && c.stability > 21).length,
      suspendedCards: 0,
      buriedCards: 0,
      streak: 0,
      dailyGoal: 10,
      todayStudied: 0,
    };
  }

  static saveStats(stats: StudyStats): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  static clearAll(): void {
    if (!this.isClient()) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}