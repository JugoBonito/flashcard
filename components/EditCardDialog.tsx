'use client';

import React, { useState, useEffect } from 'react';
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

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: FlashCard;
  onEditCard: (card: FlashCard) => void;
}

export function EditCardDialog({ open, onOpenChange, card, onEditCard }: EditCardDialogProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setFront(card.front);
      setBack(card.back);
      setTags(card.tags.join(', '));
    }
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!front.trim() || !back.trim()) return;
    
    setIsLoading(true);
    
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const updatedCard: FlashCard = {
      ...card,
      front: front.trim(),
      back: back.trim(),
      tags: tagArray,
      updatedAt: new Date(),
    };
    
    onEditCard(updatedCard);
    setIsLoading(false);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription>
            Update your flashcard content
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}