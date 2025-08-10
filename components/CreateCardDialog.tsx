'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FlashCard } from '@/types/flashcard';
import { fsrsManager } from '@/lib/fsrs';

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  onCreateCard: (card: FlashCard) => void;
}

export function CreateCardDialog({ open, onOpenChange, deckId, onCreateCard }: CreateCardDialogProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!front.trim() || !back.trim()) return;
    
    setIsLoading(true);
    
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const card = fsrsManager.createNewCard(
      front.trim(),
      back.trim(),
      deckId,
      tagArray
    );
    
    onCreateCard(card);
    
    // Reset form
    setFront('');
    setBack('');
    setTags('');
    setIsLoading(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setFront('');
      setBack('');
      setTags('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
          <DialogDescription>
            Add a new flashcard to your deck
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="front" className="text-sm font-medium">
                Front *
              </label>
              <Textarea
                id="front"
                placeholder="What's the question or prompt?"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="back" className="text-sm font-medium">
                Back *
              </label>
              <Textarea
                id="back"
                placeholder="What's the answer or explanation?"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              type="text"
              placeholder="Separate tags with commas (e.g. vocabulary, basic, lesson1)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tags help organize your cards and make them easier to find
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!front.trim() || !back.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}