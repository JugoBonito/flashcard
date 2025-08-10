import { Card as FSRSCard, State } from 'ts-fsrs';

export interface FlashCard extends FSRSCard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  media?: MediaFile[];
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  cardCount: number;
  newCardCount: number;
  dueCardCount: number;
  settings: DeckSettings;
}

export interface DeckSettings {
  newCardsPerDay: number;
  maxReviews: number;
  showAnswerTimer: boolean;
  autoAdvance: boolean;
}

export interface ReviewSession {
  id: string;
  deckId: string;
  startTime: Date;
  endTime?: Date;
  cardsReviewed: number;
  correctAnswers: number;
  averageTime: number;
  cardResults: ReviewResult[];
}

export interface ReviewResult {
  cardId: string;
  rating: Rating;
  timeSpent: number;
  timestamp: Date;
}

export interface MediaFile {
  filename: string;
  data: Uint8Array;
  type: 'image' | 'audio' | 'video';
}

export interface AnkiCard {
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

export interface AnkiNote {
  id: number;
  guid: string;
  mid: number;
  mod: number;
  usn: number;
  tags: string;
  flds: string;
  sfld: string;
  csum: number;
  flags: number;
  data: string;
}

export interface AnkiModel {
  id: number;
  name: string;
  flds: AnkiField[];
  tmpls: AnkiTemplate[];
  css: string;
  type: number;
}

export interface AnkiField {
  name: string;
  ord: number;
  sticky: boolean;
  rtl: boolean;
  font: string;
  size: number;
  description: string;
}

export interface AnkiTemplate {
  name: string;
  ord: number;
  qfmt: string;
  afmt: string;
  bqfmt: string;
  bafmt: string;
  did?: number;
  bfont: string;
  bsize: number;
}

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface StudyStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  matureCards: number;
  suspendedCards: number;
  buriedCards: number;
  streak: number;
  dailyGoal: number;
  todayStudied: number;
}

export { State };