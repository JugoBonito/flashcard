'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Deck } from '@/types/flashcard';
import { Storage } from '@/lib/storage';

interface DeckSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: Deck;
  onSettingsUpdate: (updatedDeck: Deck) => void;
}

export function DeckSettingsDialog({ open, onOpenChange, deck, onSettingsUpdate }: DeckSettingsDialogProps) {
  const [deckName, setDeckName] = useState(deck.name);
  const [deckDescription, setDeckDescription] = useState(deck.description || '');
  const [newCardsPerDay, setNewCardsPerDay] = useState(deck.settings.newCardsPerDay);
  const [maxReviews, setMaxReviews] = useState(deck.settings.maxReviews);
  const [showAnswerTimer, setShowAnswerTimer] = useState(deck.settings.showAnswerTimer);
  const [autoAdvance, setAutoAdvance] = useState(deck.settings.autoAdvance);

  useEffect(() => {
    // Reset form when dialog opens with a different deck
    setDeckName(deck.name);
    setDeckDescription(deck.description || '');
    setNewCardsPerDay(deck.settings.newCardsPerDay);
    setMaxReviews(deck.settings.maxReviews);
    setShowAnswerTimer(deck.settings.showAnswerTimer);
    setAutoAdvance(deck.settings.autoAdvance);
  }, [deck]);

  const handleSave = () => {
    const updatedDeck: Deck = {
      ...deck,
      name: deckName.trim() || deck.name,
      description: deckDescription.trim() || undefined,
      updatedAt: new Date(),
      settings: {
        ...deck.settings,
        newCardsPerDay: Math.max(1, Math.min(999, newCardsPerDay)),
        maxReviews: Math.max(1, Math.min(9999, maxReviews)),
        showAnswerTimer,
        autoAdvance,
      },
    };

    Storage.saveDeck(updatedDeck);
    onSettingsUpdate(updatedDeck);
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset to original values
    setDeckName(deck.name);
    setDeckDescription(deck.description || '');
    setNewCardsPerDay(deck.settings.newCardsPerDay);
    setMaxReviews(deck.settings.maxReviews);
    setShowAnswerTimer(deck.settings.showAnswerTimer);
    setAutoAdvance(deck.settings.autoAdvance);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Deck Settings
          </DialogTitle>
          <DialogDescription>
            Configure your deck settings and study preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deckName">Deck Name</Label>
              <Input
                id="deckName"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Enter deck name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deckDescription">Description (optional)</Label>
              <Input
                id="deckDescription"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                placeholder="Describe what this deck covers"
              />
            </div>
          </div>

          <Separator />

          {/* Study Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Study Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newCardsPerDay">New Cards Per Day</Label>
                <Input
                  id="newCardsPerDay"
                  type="number"
                  min="1"
                  max="999"
                  value={newCardsPerDay}
                  onChange={(e) => setNewCardsPerDay(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum new cards to study daily
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxReviews">Max Reviews</Label>
                <Input
                  id="maxReviews"
                  type="number"
                  min="1"
                  max="9999"
                  value={maxReviews}
                  onChange={(e) => setMaxReviews(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum review cards per session
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Answer Timer</Label>
                  <p className="text-xs text-muted-foreground">
                    Display how long you took to answer
                  </p>
                </div>
                <Switch
                  checked={showAnswerTimer}
                  onCheckedChange={setShowAnswerTimer}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Advance</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically show next card after rating
                  </p>
                </div>
                <Switch
                  checked={autoAdvance}
                  onCheckedChange={setAutoAdvance}
                />
              </div>
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save size={16} />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}