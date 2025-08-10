import { FSRS, createEmptyCard, Rating, Card, State } from 'ts-fsrs';
import { FlashCard, Rating as FlashCardRating } from '@/types/flashcard';

type Grade = Exclude<Rating, Rating.Manual>;
import { v4 as uuidv4 } from 'uuid';

export class FSRSManager {
  private fsrs: FSRS;

  constructor() {
    this.fsrs = new FSRS({
      // Default FSRS parameters optimized for general learning
      request_retention: 0.9,
      maximum_interval: 36500,
      enable_fuzz: true,
      enable_short_term: true,
    });
  }

  createNewCard(front: string, back: string, deckId: string, tags: string[] = []): FlashCard {
    const emptyCard = createEmptyCard();
    const now = new Date();
    
    return {
      id: uuidv4(),
      front,
      back,
      deckId,
      tags,
      createdAt: now,
      updatedAt: now,
      ...emptyCard,
    };
  }

  reviewCard(card: FlashCard, rating: FlashCardRating, reviewTime?: Date): FlashCard {
    const now = reviewTime || new Date();
    
    // Convert our rating (1-4) to FSRS Grade
    const grade = this.ratingToGrade(rating);
    
    // Create FSRS card from our FlashCard
    const fsrsCard: Card = {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      learning_steps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.last_review,
    };

    // Schedule the card using FSRS
    const scheduling = this.fsrs.repeat(fsrsCard, now);
    const updatedCard = scheduling[grade];

    // Return updated FlashCard
    return {
      ...card,
      ...updatedCard.card,
      updatedAt: now,
    };
  }

  private ratingToGrade(rating: FlashCardRating): Grade {
    switch (rating) {
      case 1: return Rating.Again;
      case 2: return Rating.Hard;
      case 3: return Rating.Good;
      case 4: return Rating.Easy;
      default: return Rating.Good;
    }
  }

  getNextReviewOptions(card: FlashCard, reviewTime?: Date) {
    const now = reviewTime || new Date();
    
    const fsrsCard: Card = {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      learning_steps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.last_review,
    };

    const scheduling = this.fsrs.repeat(fsrsCard, now);
    
    return {
      again: {
        card: scheduling[Rating.Again],
        interval: this.formatInterval(scheduling[Rating.Again].card.scheduled_days),
        due: scheduling[Rating.Again].card.due,
      },
      hard: {
        card: scheduling[Rating.Hard],
        interval: this.formatInterval(scheduling[Rating.Hard].card.scheduled_days),
        due: scheduling[Rating.Hard].card.due,
      },
      good: {
        card: scheduling[Rating.Good],
        interval: this.formatInterval(scheduling[Rating.Good].card.scheduled_days),
        due: scheduling[Rating.Good].card.due,
      },
      easy: {
        card: scheduling[Rating.Easy],
        interval: this.formatInterval(scheduling[Rating.Easy].card.scheduled_days),
        due: scheduling[Rating.Easy].card.due,
      },
    };
  }

  private formatInterval(days: number): string {
    if (days < 1) {
      const minutes = Math.round(days * 24 * 60);
      return `${minutes}m`;
    } else if (days < 30) {
      return `${Math.round(days)}d`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      return `${months}mo`;
    } else {
      const years = Math.round(days / 365);
      return `${years}y`;
    }
  }

  calculateRetention(card: FlashCard, reviewTime?: Date): number {
    const now = reviewTime || new Date();
    
    const fsrsCard: Card = {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      learning_steps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.last_review,
    };

    return this.fsrs.get_retrievability(fsrsCard, now, false);
  }

  isCardDue(card: FlashCard, now?: Date): boolean {
    const currentTime = now || new Date();
    return card.due <= currentTime;
  }

  getCardsByDueStatus(cards: FlashCard[], now?: Date) {
    const currentTime = now || new Date();
    
    return {
      due: cards.filter(card => this.isCardDue(card, currentTime)),
      new: cards.filter(card => card.state === State.New),
      learning: cards.filter(card => card.state === State.Learning || card.state === State.Relearning),
      review: cards.filter(card => card.state === State.Review && !this.isCardDue(card, currentTime)),
    };
  }
}

export const fsrsManager = new FSRSManager();