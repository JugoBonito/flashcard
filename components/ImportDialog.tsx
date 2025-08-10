'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, File, Download, Info } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ankiImporter as simpleImporter } from '@/lib/ankiImportSimple';
import { AnkiImporter } from '@/lib/ankiImporter';
import { AnkiApkgImporter } from '@/lib/ankiApkgImporter';
import { Storage } from '@/lib/storage';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

type ImportState = 'idle' | 'processing' | 'success' | 'error';
type ImportFormat = 'csv' | 'text' | 'json';

export function ImportDialog({ open, onOpenChange, onImportSuccess }: ImportDialogProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [importedData, setImportedData] = useState<{ deckName: string; cardCount: number } | null>(null);
  const [activeTab, setActiveTab] = useState<ImportFormat>('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState('processing');
    setProgress(10);
    setError(null);

    try {
      let result;
      
      switch (activeTab) {
        case 'csv':
          if (file.name.endsWith('.apkg')) {
            // Handle .apkg files with full SQLite support
            const apkgImporter = new AnkiApkgImporter((progress) => setProgress(progress));
            result = await apkgImporter.importFromAPKG(file, deckName || undefined);
          } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            // Handle CSV/TXT files with enhanced Anki text parser
            const ankiImporter = new AnkiImporter((progress) => setProgress(progress));
            result = await ankiImporter.importFromAnkiText(file, deckName || undefined);
          } else {
            throw new Error('Please select a CSV, TXT, or APKG file');
          }
          break;
          
        case 'text':
          if (!file.name.endsWith('.txt')) {
            throw new Error('Please select a TXT file');
          }
          const ankiImporter = new AnkiImporter((progress) => setProgress(progress));
          result = await ankiImporter.importFromAnkiText(file, deckName || undefined);
          break;
          
        case 'json':
          if (!file.name.endsWith('.json')) {
            throw new Error('Please select a JSON file');
          }
          result = await simpleImporter.importFromJSON(file);
          setProgress(100);
          break;
          
        default:
          throw new Error('Invalid import format');
      }

      // Save to storage
      Storage.saveDeck(result.deck);
      
      // Add new cards to existing cards instead of replacing
      const existingCards = Storage.getCards();
      const allCards = [...existingCards, ...result.cards];
      Storage.saveCards(allCards);
      
      setState('success');
      setImportedData({
        deckName: result.deck.name,
        cardCount: result.cards.length,
      });

      // Call success callback after a short delay
      setTimeout(() => {
        onImportSuccess();
        handleClose(false);
      }, 1500);

    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import file');
      setState('error');
      setProgress(0);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setState('idle');
      setProgress(0);
      setError(null);
      setImportedData(null);
      setDeckName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    onOpenChange(open);
  };

  const handleRetry = () => {
    setState('idle');
    setProgress(0);
    setError(null);
    setImportedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStateMessage = () => {
    switch (state) {
      case 'processing':
        return 'Processing file...';
      case 'success':
        return 'Import successful!';
      case 'error':
        return 'Import failed';
      default:
        return '';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} />
            Import Flashcards
          </DialogTitle>
          <DialogDescription>
            Import flashcards from various formats including Anki exports, CSV, and text files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {state === 'idle' && (
            <>
              <div className="space-y-4">
                <div>
                  <label htmlFor="deckName" className="text-sm font-medium mb-2 block">
                    Deck Name (optional)
                  </label>
                  <Input
                    id="deckName"
                    placeholder="Leave empty to use filename"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                  />
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ImportFormat)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="csv" className="gap-1 sm:gap-2 flex-col sm:flex-row p-2 sm:p-3">
                      <FileText size={14} />
                      <span className="text-xs sm:text-sm">CSV/Anki</span>
                    </TabsTrigger>
                    <TabsTrigger value="text" className="gap-1 sm:gap-2 flex-col sm:flex-row p-2 sm:p-3">
                      <File size={14} />
                      <span className="text-xs sm:text-sm">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="json" className="gap-1 sm:gap-2 flex-col sm:flex-row p-2 sm:p-3">
                      <Download size={14} />
                      <span className="text-xs sm:text-sm">JSON</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="csv" className="space-y-3 sm:space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center gap-2 sm:gap-3">
                        <div className="rounded-full bg-blue-100 dark:bg-blue-950/50 p-2 sm:p-3">
                          <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm sm:text-base">CSV / Anki Export</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Upload CSV files, Anki .apkg decks (with media support), or text files
                          </p>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="w-full sm:w-auto">
                          Choose File
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <div className="flex gap-2">
                        <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">Supported Formats:</p>
                          <p className="text-blue-700 dark:text-blue-300">
                            • CSV: Front, Back, Tags (optional)<br/>
                            • APKG: Full Anki deck exports with media files and scheduling<br/>
                            • TXT: Tab-separated or plain text from Anki
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-green-100 dark:bg-green-950/50 p-3">
                          <File size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">Simple Text Format</h3>
                          <p className="text-sm text-muted-foreground">
                            Plain text with alternating questions and answers
                          </p>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Choose Text File
                        </Button>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                      <div className="flex gap-2">
                        <Info size={16} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900 dark:text-green-100">Text Format:</p>
                          <p className="text-green-700 dark:text-green-300">
                            Line 1: Question, Line 2: Answer, Line 3: Question, Line 4: Answer...
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="json" className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-950/50 p-3">
                          <Download size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">FlashCard Pro Export</h3>
                          <p className="text-sm text-muted-foreground">
                            Import previously exported JSON files from this app
                          </p>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Choose JSON File
                        </Button>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                      <div className="flex gap-2">
                        <Info size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-purple-900 dark:text-purple-100">JSON Format:</p>
                          <p className="text-purple-700 dark:text-purple-300">
                            Complete deck exports with progress, scheduling, and metadata.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {(state === 'processing') && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {getStateIcon()}
                  <span className="font-medium">{getStateMessage()}</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Processing your flashcards...
                </p>
              </div>
            </div>
          )}

          {state === 'success' && importedData && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">Import Successful!</span>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{importedData.deckName}</p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    {importedData.cardCount} cards imported
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle size={20} />
                  <span className="font-medium">Import Failed</span>
                </div>
                {error && (
                  <p className="text-sm text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex justify-center">
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                  <Upload size={16} />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {state === 'idle' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={activeTab === 'csv' ? '.csv,.apkg' : activeTab === 'text' ? '.txt' : '.json'}
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}