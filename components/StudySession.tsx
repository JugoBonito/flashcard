'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Eye, CheckCircle, Timer, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Storage } from '@/lib/storage';
import { fsrsManager } from '@/lib/fsrs';
import { Deck, FlashCard, Rating } from '@/types/flashcard';
import { State } from 'ts-fsrs';
import { BackgroundMusicControls } from './BackgroundMusicControls';
import { MediaCardContent } from './MediaCardContent';

interface StudySessionProps {
  deckId: string;
}

interface SessionStats {
  cardsStudied: number;
  totalCards: number;
  correctAnswers: number;
  startTime: Date;
  timeSpent: number;
}

export function StudySession({ deckId }: StudySessionProps) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [studyCards, setStudyCards] = useState<FlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    cardsStudied: 0,
    totalCards: 0,
    correctAnswers: 0,
    startTime: new Date(),
    timeSpent: 0,
  });
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [reviewOptions, setReviewOptions] = useState<{
    again: { interval: string; due: Date };
    hard: { interval: string; due: Date };
    good: { interval: string; due: Date };
    easy: { interval: string; due: Date };
  } | null>(null);

  const initializeSession = useCallback(() => {
    const loadedDeck = Storage.getDeck(deckId);
    if (!loadedDeck) {
      router.push('/');
      return;
    }

    // const allCards = Storage.getCards(deckId);
    
    // Get due cards and new cards for study
    const dueCards = Storage.getDueCards(deckId);
    const newCards = Storage.getNewCards(deckId);
    
    // Combine and limit based on deck settings
    const cardsToStudy = [
      ...dueCards,
      ...newCards.slice(0, loadedDeck.settings.newCardsPerDay)
    ].slice(0, loadedDeck.settings.maxReviews);

    if (cardsToStudy.length === 0) {
      setIsSessionComplete(true);
      return;
    }

    setDeck(loadedDeck);
    setStudyCards(cardsToStudy);
    setSessionStats({
      cardsStudied: 0,
      totalCards: cardsToStudy.length,
      correctAnswers: 0,
      startTime: new Date(),
      timeSpent: 0,
    });
    setCardStartTime(new Date());
  }, [deckId, router]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (studyCards.length > 0 && currentCardIndex < studyCards.length) {
      const currentCard = studyCards[currentCardIndex];
      const options = fsrsManager.getNextReviewOptions(currentCard);
      setReviewOptions(options);
    }
  }, [studyCards, currentCardIndex]);

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleRating = useCallback(async (rating: Rating) => {
    if (currentCardIndex >= studyCards.length) return;

    const currentCard = studyCards[currentCardIndex];
    const cardEndTime = new Date();
    const timeSpent = cardEndTime.getTime() - cardStartTime.getTime();

    // Update card using FSRS
    const updatedCard = fsrsManager.reviewCard(currentCard, rating, cardEndTime);
    
    // Save updated card
    Storage.saveCard(updatedCard);

    // Update session stats
    const isCorrect = rating >= 3; // Good or Easy is considered correct
    setSessionStats(prev => ({
      ...prev,
      cardsStudied: prev.cardsStudied + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      timeSpent: prev.timeSpent + timeSpent,
    }));

    // Move to next card or finish session
    if (currentCardIndex + 1 >= studyCards.length) {
      setIsSessionComplete(true);
      
      // Update deck stats
      if (deck) {
        const updatedCards = Storage.getCards(deckId);
        deck.cardCount = updatedCards.length;
        deck.newCardCount = updatedCards.filter(card => card.state === State.New).length;
        deck.dueCardCount = updatedCards.filter(card => card.due <= new Date()).length;
        Storage.saveDeck(deck);
      }
    } else {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
      setCardStartTime(new Date());
    }
  }, [currentCardIndex, studyCards, cardStartTime, deck, deckId]);

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsSessionComplete(false);
    setCardStartTime(new Date());
    setSessionStats(prev => ({
      ...prev,
      cardsStudied: 0,
      correctAnswers: 0,
      startTime: new Date(),
      timeSpent: 0,
    }));
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getAccuracyPercentage = () => {
    if (sessionStats.cardsStudied === 0) return 0;
    return Math.round((sessionStats.correctAnswers / sessionStats.cardsStudied) * 100);
  };

  if (!deck || studyCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="mx-auto text-green-500" size={48} />
            <h2 className="text-2xl font-bold">All Caught Up!</h2>
            <p className="text-muted-foreground">
              No cards are due for review right now. Great job!
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push(`/deck/${deckId}`)} variant="outline">
                View Deck
              </Button>
              <Button onClick={() => router.push('/')}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <CheckCircle className="mx-auto text-green-500" size={64} />
              <h2 className="text-3xl font-bold">Session Complete!</h2>
              <p className="text-muted-foreground text-lg">
                Great work! You&apos;ve completed your study session.
              </p>
            </div>

            {/* Session Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">{sessionStats.cardsStudied}</div>
                <div className="text-sm text-muted-foreground">Cards Studied</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">{getAccuracyPercentage()}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">{formatTime(sessionStats.timeSpent)}</div>
                <div className="text-sm text-muted-foreground">Time Spent</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleRestart} variant="outline" className="gap-2">
                <RotateCcw size={16} />
                Study Again
              </Button>
              <Button onClick={() => router.push(`/deck/${deckId}`)} variant="outline">
                View Deck
              </Button>
              <Button onClick={() => router.push('/')}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = studyCards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / studyCards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push(`/deck/${deckId}`)} className="gap-2 p-2">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <BackgroundMusicControls />
          </div>
          
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{deck.name}</h1>
            <p className="text-sm text-muted-foreground">
              Card {currentCardIndex + 1} of {studyCards.length}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Timer size={14} className="text-muted-foreground" />
              <span className="text-xs sm:text-sm">{formatTime(sessionStats.timeSpent)}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Target size={14} className="text-muted-foreground" />
              <span className="text-xs sm:text-sm">{getAccuracyPercentage()}%</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Card className="min-h-[300px] sm:min-h-[400px] border-2 shadow-xl bg-gradient-to-br from-card via-card to-card/95">
            <CardContent className="p-4 sm:p-8 h-full flex flex-col">
              {/* Card State Badge */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {currentCard.state}
                </Badge>
                {currentCard.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {currentCard.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {currentCard.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentCard.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="flex-1 flex flex-col justify-center space-y-6 sm:space-y-8">
                {/* Front */}
                <div className="text-center">
                  <h3 className="text-sm sm:text-lg font-medium text-muted-foreground mb-3 sm:mb-4">Question</h3>
                  <MediaCardContent 
                    content={currentCard.front} 
                    className="text-lg sm:text-2xl md:text-3xl font-medium leading-relaxed"
                  />
                </div>

                {/* Back (shown when revealed) */}
                {showAnswer && (
                  <>
                    <hr className="my-6 sm:my-8" />
                    <div className="text-center">
                      <h3 className="text-sm sm:text-lg font-medium text-muted-foreground mb-3 sm:mb-4">Answer</h3>
                      <MediaCardContent 
                        content={currentCard.back} 
                        className="text-base sm:text-xl md:text-2xl leading-relaxed text-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 sm:mt-8 text-center">
                {!showAnswer ? (
                  <Button onClick={handleRevealAnswer} size="lg" className="gap-2 w-full sm:w-auto sm:min-w-[200px]">
                    <Eye size={20} />
                    Show Answer
                  </Button>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">How well did you know this?</p>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3">
                      <Button
                        onClick={() => handleRating(1)}
                        variant="outline"
                        className="flex-col h-auto p-3 sm:p-4 sm:min-w-[120px] border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <span className="font-medium text-red-600 text-sm">Again</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {reviewOptions?.again.interval}
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleRating(2)}
                        variant="outline"
                        className="flex-col h-auto p-3 sm:p-4 sm:min-w-[120px] border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                      >
                        <span className="font-medium text-orange-600 text-sm">Hard</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {reviewOptions?.hard.interval}
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleRating(3)}
                        variant="outline"
                        className="flex-col h-auto p-3 sm:p-4 sm:min-w-[120px] border-green-200 hover:bg-green-50 hover:border-green-300"
                      >
                        <span className="font-medium text-green-600 text-sm">Good</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {reviewOptions?.good.interval}
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleRating(4)}
                        variant="outline"
                        className="flex-col h-auto p-3 sm:p-4 sm:min-w-[120px] border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <span className="font-medium text-blue-600 text-sm">Easy</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {reviewOptions?.easy.interval}
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <div>Studied: {sessionStats.cardsStudied}</div>
              <div>Correct: {sessionStats.correctAnswers}</div>
              <div>Left: {studyCards.length - currentCardIndex - 1}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}