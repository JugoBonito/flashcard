import { Deck, FlashCard } from '@/types/flashcard';

export function exportDeckAsJSON(deck: Deck, cards: FlashCard[]) {
  const exportData = {
    deck: {
      ...deck,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    cards: cards.map(card => ({
      ...card,
      // Convert dates to ISO strings for JSON compatibility
      due: card.due.toISOString(),
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      last_review: card.last_review?.toISOString(),
    }))
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDeckAsCSV(deck: Deck, cards: FlashCard[]) {
  const headers = ['Front', 'Back', 'Tags', 'State', 'Reps', 'Due Date', 'Created At'];
  const rows = [
    headers,
    ...cards.map(card => [
      `"${card.front.replace(/"/g, '""')}"`,
      `"${card.back.replace(/"/g, '""')}"`,
      `"${card.tags.join(', ')}"`,
      card.state,
      card.reps.toString(),
      card.due.toLocaleDateString(),
      card.createdAt.toLocaleDateString()
    ])
  ];

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}