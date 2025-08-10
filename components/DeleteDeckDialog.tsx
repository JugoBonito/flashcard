'use client';

import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Deck } from '@/types/flashcard';

interface DeleteDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: Deck | null;
  onConfirmDelete: () => void;
}

export function DeleteDeckDialog({ open, onOpenChange, deck, onConfirmDelete }: DeleteDeckDialogProps) {
  if (!deck) return null;

  const handleDelete = () => {
    onConfirmDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={20} />
            Delete Deck
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the deck and all its cards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-lg">{deck.name}</h4>
            {deck.description && (
              <p className="text-sm text-muted-foreground">{deck.description}</p>
            )}
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {deck.cardCount} cards
              </Badge>
              {deck.dueCardCount > 0 && (
                <Badge variant="destructive">
                  {deck.dueCardCount} due
                </Badge>
              )}
              {deck.newCardCount > 0 && (
                <Badge variant="outline">
                  {deck.newCardCount} new
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex gap-2">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100">Warning</p>
                <p className="text-red-700 dark:text-red-300">
                  Deleting this deck will permanently remove all {deck.cardCount} cards and your study progress. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 size={16} />
            Delete Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}