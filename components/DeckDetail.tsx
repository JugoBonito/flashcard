'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Play, Settings, Trash2, Edit3, BookOpen, Clock, Brain, Target, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Storage } from '@/lib/storage';
import { exportDeckAsJSON } from '@/lib/export';
import { Deck, FlashCard } from '@/types/flashcard';
import { State } from 'ts-fsrs';
import { CreateCardDialog } from './CreateCardDialog';
import { EditCardDialog } from './EditCardDialog';
import { DeckSettingsDialog } from './DeckSettingsDialog';
import { DeleteDeckDialog } from './DeleteDeckDialog';
import { MediaCardContent } from './MediaCardContent';
import Link from 'next/link';

interface DeckDetailProps {
  deckId: string;
}

export function DeckDetail({ deckId }: DeckDetailProps) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDeckData = useCallback(() => {
    const loadedDeck = Storage.getDeck(deckId);
    if (!loadedDeck) {
      router.push('/');
      return;
    }

    const loadedCards = Storage.getCards(deckId);
    
    // Update deck stats
    loadedDeck.cardCount = loadedCards.length;
    loadedDeck.newCardCount = loadedCards.filter(card => card.state === State.New).length;
    loadedDeck.dueCardCount = loadedCards.filter(card => card.due <= new Date()).length;
    
    Storage.saveDeck(loadedDeck);
    
    setDeck(loadedDeck);
    setCards(loadedCards);
    setLoading(false);
  }, [deckId, router]);

  useEffect(() => {
    loadDeckData();
  }, [loadDeckData]);

  const handleCreateCard = (card: FlashCard) => {
    Storage.saveCard(card);
    loadDeckData();
    setIsCreateCardOpen(false);
  };

  const handleEditCard = (card: FlashCard) => {
    Storage.saveCard(card);
    loadDeckData();
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    Storage.deleteCard(cardId);
    loadDeckData();
  };

  const handleExportDeck = () => {
    if (deck && cards.length > 0) {
      exportDeckAsJSON(deck, cards);
    }
  };

  const handleSettingsUpdate = (updatedDeck: Deck) => {
    setDeck(updatedDeck);
  };

  const handleDeleteDeck = () => {
    if (!deck) return;
    Storage.deleteDeck(deck.id);
    router.push('/');
  };

  const calculateProgress = () => {
    if (cards.length === 0) return 0;
    const studiedCards = cards.filter(card => card.reps > 0).length;
    return (studiedCards / cards.length) * 100;
  };

  const getStateColor = (state: State) => {
    switch (state) {
      case State.New: return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case State.Learning: return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      case State.Review: return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      case State.Relearning: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getStateLabel = (state: State) => {
    switch (state) {
      case State.New: return 'New';
      case State.Learning: return 'Learning';
      case State.Review: return 'Review';
      case State.Relearning: return 'Relearning';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="gap-2 p-2 sm:px-4">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{deck.name}</h1>
        </div>

        {/* Deck Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {deck.cardCount}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Total Cards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="text-emerald-600 dark:text-emerald-400" size={20} />
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {deck.dueCardCount}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">Due Cards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Brain className="text-purple-600 dark:text-purple-400" size={20} />
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {deck.newCardCount}
                  </p>
                  <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">New Cards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Target className="text-amber-600 dark:text-amber-400" size={20} />
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {Math.round(calculateProgress())}%
                  </p>
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Section */}
        {(deck.dueCardCount > 0 || deck.newCardCount > 0) && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5">
            <CardContent className="p-4 sm:p-8">
              <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 text-center">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to Study</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    You have {deck.dueCardCount + deck.newCardCount} cards ready for review
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {deck.dueCardCount > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs">
                        {deck.dueCardCount} due
                      </Badge>
                    )}
                    {deck.newCardCount > 0 && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 text-xs">
                        {deck.newCardCount} new
                      </Badge>
                    )}
                  </div>
                </div>
                <Link href={`/study/${deck.id}`} className="w-full sm:w-auto">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg shadow-primary/25 w-full sm:w-auto">
                    <Play size={20} />
                    Start Studying
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deck Actions */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          <Button onClick={() => setIsCreateCardOpen(true)} className="gap-2 text-sm">
            <Plus size={14} />
            <span className="hidden sm:inline">Add Card</span>
            <span className="sm:hidden">Add</span>
          </Button>
          {cards.length > 0 && (
            <Button variant="outline" onClick={handleExportDeck} className="gap-2 text-sm">
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2 text-sm">
            <Settings size={14} />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsDeleteDialogOpen(true)} 
            className="gap-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Delete Deck</span>
            <span className="sm:hidden">Delete</span>
          </Button>
        </div>

        {/* Cards List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Cards ({cards.length})</CardTitle>
            {deck.description && (
              <CardDescription>{deck.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-muted/20 p-6 w-fit mx-auto mb-4">
                  <BookOpen size={48} className="text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first flashcard to start learning
                </p>
                <Button onClick={() => setIsCreateCardOpen(true)} className="gap-2">
                  <Plus size={16} />
                  Add First Card
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Learning Progress</span>
                    <span>{Math.round(calculateProgress())}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>

                <Separator />

                {/* Cards Grid */}
                <div className="grid gap-4">
                  {cards.map((card) => (
                    <Card key={card.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Front</p>
                                <MediaCardContent content={card.front} className="line-clamp-2 text-sm" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Back</p>
                                <MediaCardContent content={card.back} className="line-clamp-2 text-sm" />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <Badge className={getStateColor(card.state)} variant="secondary">
                                {getStateLabel(card.state)}
                              </Badge>
                              <span>Reps: {card.reps}</span>
                              <span>Due: {card.due.toLocaleDateString()}</span>
                              {card.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {card.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {card.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{card.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCard(card)}
                              className="gap-1"
                            >
                              <Edit3 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCard(card.id)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateCardDialog
        open={isCreateCardOpen}
        onOpenChange={setIsCreateCardOpen}
        deckId={deckId}
        onCreateCard={handleCreateCard}
      />

      {editingCard && (
        <EditCardDialog
          open={true}
          onOpenChange={(open) => !open && setEditingCard(null)}
          card={editingCard}
          onEditCard={handleEditCard}
        />
      )}

      {deck && (
        <DeckSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          deck={deck}
          onSettingsUpdate={handleSettingsUpdate}
        />
      )}

      <DeleteDeckDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deck={deck}
        onConfirmDelete={handleDeleteDeck}
      />
    </div>
  );
}