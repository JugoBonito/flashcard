import { Deck, FlashCard } from '@/types/flashcard';
import { fsrsManager } from './fsrs';
import { v4 as uuidv4 } from 'uuid';

export function createSampleDeck(): { deck: Deck; cards: FlashCard[] } {
  const now = new Date();
  const deckId = uuidv4();
  
  const deck: Deck = {
    id: deckId,
    name: 'JavaScript Fundamentals',
    description: 'Essential JavaScript concepts for web development',
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

  const cardData = [
    {
      front: 'What is a closure in JavaScript?',
      back: 'A closure is a function that has access to variables from its outer (enclosing) scope even after the outer function has returned.',
      tags: ['functions', 'scope', 'intermediate']
    },
    {
      front: 'What is the difference between `let`, `const`, and `var`?',
      back: '`var` is function-scoped and hoisted, `let` and `const` are block-scoped. `const` creates immutable bindings.',
      tags: ['variables', 'es6', 'basic']
    },
    {
      front: 'What is event bubbling?',
      back: 'Event bubbling is when an event starts from the target element and bubbles up through its parent elements.',
      tags: ['dom', 'events', 'intermediate']
    },
    {
      front: 'What does `this` refer to in JavaScript?',
      back: '`this` refers to the context in which a function is called. Its value depends on how the function is invoked.',
      tags: ['context', 'functions', 'intermediate']
    },
    {
      front: 'What is the purpose of `async`/`await`?',
      back: '`async`/`await` provides a cleaner way to work with Promises, making asynchronous code look more like synchronous code.',
      tags: ['async', 'promises', 'es2017']
    },
    {
      front: 'What is the difference between `==` and `===`?',
      back: '`==` performs type coercion before comparison, while `===` compares both value and type without coercion.',
      tags: ['comparison', 'operators', 'basic']
    },
    {
      front: 'What is destructuring in JavaScript?',
      back: 'Destructuring is a syntax that allows unpacking values from arrays or properties from objects into distinct variables.',
      tags: ['es6', 'syntax', 'arrays', 'objects']
    },
    {
      front: 'What is the spread operator (...)?',
      back: 'The spread operator expands iterables (arrays, strings, objects) into individual elements or properties.',
      tags: ['es6', 'operators', 'arrays', 'objects']
    }
  ];

  const cards = cardData.map(data => {
    return fsrsManager.createNewCard(data.front, data.back, deckId, data.tags);
  });

  deck.cardCount = cards.length;
  deck.newCardCount = cards.length;
  deck.dueCardCount = 0;

  return { deck, cards };
}