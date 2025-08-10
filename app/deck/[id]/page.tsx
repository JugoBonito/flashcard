import React from 'react';
import { DeckDetail } from '@/components/DeckDetail';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DeckDetail deckId={resolvedParams.id} />;
}