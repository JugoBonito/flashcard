'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Brain, TrendingUp, Upload, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Storage } from '@/lib/storage';
import { createSampleDeck } from '@/lib/sampleData';
import { Deck, StudyStats } from '@/types/flashcard';
import { CreateDeckDialog } from './CreateDeckDialog';
import { ImportDialog } from './ImportDialog';
import Link from 'next/link';

export function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedDecks = Storage.getDecks();
    const loadedStats = Storage.getStats();
    setDecks(loadedDecks);
    setStats(loadedStats);
  };

  const handleCreateDeck = (deck: Deck) => {
    Storage.saveDeck(deck);
    loadData();
    setIsCreateDialogOpen(false);
  };

  const handleLoadSampleDeck = () => {
    const { deck, cards } = createSampleDeck();
    Storage.saveDeck(deck);
    Storage.saveCards(cards);
    loadData();
  };

  const handleImportSuccess = () => {
    loadData();
    setIsImportDialogOpen(false);
  };

  const formatStreakDays = (streak: number) => {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return '1 day streak';
    return `${streak} day streak`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FlashCard Pro
            </h1>
            <p className="text-muted-foreground text-lg">
              Master any subject with intelligent spaced repetition
            </p>
          </div>
          
          <div className="flex gap-3 animate-in slide-in-from-right-5 fade-in-0 duration-700">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="gap-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              <Upload size={16} className="transition-transform group-hover:scale-110" />
              Import Deck
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
            >
              <Plus size={16} className="transition-transform group-hover:rotate-90" />
              Create Deck
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 animate-in slide-in-from-left-8 fade-in-0 duration-700 hover:scale-105 transition-transform">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <BookOpen size={20} className="animate-bounce" />
                  Total Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.totalCards}
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {stats.newCards} new • {stats.dueCards} due
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 animate-in slide-in-from-left-8 fade-in-0 duration-700 hover:scale-105 transition-transform" style={{animationDelay: '100ms'}}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Brain size={20} className="animate-pulse" />
                  Daily Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {stats.todayStudied}
                </div>
                <div className="mt-2 space-y-1">
                  <Progress 
                    value={(stats.todayStudied / stats.dailyGoal) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    of {stats.dailyGoal} daily goal
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 animate-in slide-in-from-left-8 fade-in-0 duration-700 hover:scale-105 transition-transform" style={{animationDelay: '200ms'}}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <TrendingUp size={20} className="animate-bounce" />
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.streak}
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  {formatStreakDays(stats.streak)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 animate-in slide-in-from-left-8 fade-in-0 duration-700 hover:scale-105 transition-transform" style={{animationDelay: '300ms'}}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Sparkles size={20} className="animate-spin" />
                  Mastery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {stats.matureCards}
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  mature cards
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Study Section */}
        {decks.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5 animate-in fade-in-50 duration-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Brain className="text-primary animate-pulse" size={24} />
                Ready to Study
              </CardTitle>
              <CardDescription>
                Continue your learning journey with due cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {decks.filter(deck => deck.dueCardCount > 0).map((deck, index) => (
                  <div
                    key={deck.id}
                    className="animate-in slide-in-from-bottom-4 fade-in-0"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationDuration: '500ms',
                      animationFillMode: 'both'
                    }}
                  >
                    <Link href={`/study/${deck.id}`}>
                      <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40 hover:scale-[1.02] hover:-translate-y-1 group">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{deck.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                {deck.dueCardCount} due
                              </Badge>
                              {deck.newCardCount > 0 && (
                                <Badge variant="outline" className="group-hover:border-primary/50 transition-colors">
                                  {deck.newCardCount} new
                                </Badge>
                              )}
                            </div>
                            <Button className="w-full group-hover:shadow-lg transition-all duration-300" size="sm">
                              Study Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decks Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Decks</h2>
            {decks.length > 0 && (
              <p className="text-muted-foreground">
                {decks.length} deck{decks.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {decks.length === 0 ? (
            <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="rounded-full bg-muted/20 p-6">
                  <BookOpen size={48} className="text-muted-foreground/50" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">No decks yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Create your first flashcard deck or import an existing Anki deck to get started
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus size={16} />
                    Create Deck
                  </Button>
                  <Button variant="outline" onClick={handleLoadSampleDeck} className="gap-2">
                    <Sparkles size={16} />
                    Try Sample Deck
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck, index) => (
                <div
                  key={deck.id}
                  className="animate-in slide-in-from-bottom-8 fade-in-0"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animationDuration: '600ms',
                    animationFillMode: 'both'
                  }}
                >
                  <Link href={`/deck/${deck.id}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 shadow-lg hover:scale-[1.02] hover:-translate-y-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                            {deck.name}
                          </CardTitle>
                          <Settings size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-90" />
                        </div>
                        {deck.description && (
                          <CardDescription className="line-clamp-2">
                            {deck.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Cards</span>
                          <Badge variant="secondary" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {deck.cardCount}
                          </Badge>
                        </div>
                        
                        {(deck.dueCardCount > 0 || deck.newCardCount > 0) && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              {deck.dueCardCount > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-red-600 dark:text-red-400">Due for review</span>
                                  <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse">
                                    {deck.dueCardCount}
                                  </Badge>
                                </div>
                              )}
                              {deck.newCardCount > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">New cards</span>
                                  <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 group-hover:border-blue-300 transition-colors">
                                    {deck.newCardCount}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground">
                            Created {/* {deck.createdAt.toLocaleDateString()} */}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateDeckDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateDeck={handleCreateDeck}
      />
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}