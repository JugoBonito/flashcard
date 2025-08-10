import React from 'react';
import { StudySession } from '@/components/StudySession';

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <StudySession deckId={resolvedParams.id} />;
}