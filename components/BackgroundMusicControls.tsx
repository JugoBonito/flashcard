'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { audioManager, AudioTrack } from '@/lib/audioManager';

interface BackgroundMusicControlsProps {
  className?: string;
  compact?: boolean;
}

export function BackgroundMusicControls({ className, compact = true }: BackgroundMusicControlsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(50);
  const [availableTracks] = useState(audioManager.getAvailableTracks());

  useEffect(() => {
    // Load initial state
    setIsEnabled(audioManager.getEnabled());
    setIsPlaying(audioManager.getIsPlaying());
    setCurrentTrack(audioManager.getCurrentTrack());
    setVolume(Math.round(audioManager.getVolume() * 100));
  }, []);

  const handleToggleMusic = async () => {
    if (!isEnabled) {
      // Enable and start with first track
      setIsEnabled(true);
      audioManager.setEnabled(true);
      if (availableTracks.length > 0) {
        await playTrack(availableTracks[0]);
      }
    } else {
      // Disable and stop
      setIsEnabled(false);
      audioManager.setEnabled(false);
      audioManager.stopCurrent();
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };

  const playTrack = async (track: AudioTrack) => {
    try {
      await audioManager.playTrack(track);
      setCurrentTrack(track);
      setIsPlaying(true);
      setIsEnabled(true);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioManager.setVolume(newVolume / 100);
  };


  const togglePlayPause = async () => {
    if (isPlaying) {
      audioManager.stopCurrent();
      setIsPlaying(false);
    } else if (currentTrack) {
      await playTrack(currentTrack);
    } else if (availableTracks.length > 0) {
      await playTrack(availableTracks[0]);
    }
  };

  const nextTrack = async () => {
    if (availableTracks.length === 0) return;
    
    const currentIndex = currentTrack ? availableTracks.findIndex(t => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % availableTracks.length;
    await playTrack(availableTracks[nextIndex]);
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isEnabled && isPlaying ? "default" : "ghost"}
            size="sm"
            className={`gap-2 transition-all ${
              isEnabled && isPlaying 
                ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 hover:from-green-500/30 hover:to-blue-500/30' 
                : ''
            } ${className}`}
          >
            {isEnabled && isPlaying ? (
              <Volume2 size={16} className="text-green-600" />
            ) : (
              <VolumeX size={16} className="text-muted-foreground" />
            )}
            <Music size={16} className={isEnabled && isPlaying ? 'text-green-600' : 'text-muted-foreground'} />
            {isEnabled && isPlaying && currentTrack && (
              <Badge variant="secondary" className="text-xs ml-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                ON
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 sm:w-96" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-primary" />
                <h4 className="font-semibold">Background Music</h4>
              </div>
              <Button
                variant={isEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleMusic}
                className="gap-2"
              >
                {isEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {isEnabled ? 'On' : 'Off'}
              </Button>
            </div>

            {isEnabled && (
              <>
                {currentTrack && (
                  <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{currentTrack.name}</p>
                          <p className="text-xs text-muted-foreground">{currentTrack.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={togglePlayPause} className="h-8 w-8 p-0">
                            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={nextTrack} className="h-8 w-8 p-0">
                            <SkipForward size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Volume</span>
                    <Badge variant="outline" className="text-xs">
                      {volume}%
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>


                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Music Collection</p>
                    <Badge variant="secondary" className="text-xs">
                      {availableTracks.length} tracks
                    </Badge>
                  </div>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {availableTracks.map((track) => (
                      <Card
                        key={track.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          currentTrack?.id === track.id
                            ? 'ring-2 ring-primary bg-gradient-to-r from-primary/10 to-secondary/10'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => playTrack(track)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{track.name}</p>
                              <p className="text-xs text-muted-foreground">{track.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {currentTrack?.id === track.id && isPlaying ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                    Playing
                                  </Badge>
                                </div>
                              ) : currentTrack?.id === track.id ? (
                                <Badge variant="outline" className="text-xs">
                                  Selected
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full controls for settings pages
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Background Music</h3>
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggleMusic}
              className="gap-2"
            >
              {isEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {isEnabled && (
            <div className="space-y-4">
              {currentTrack && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{currentTrack.name}</p>
                    <p className="text-sm text-muted-foreground">{currentTrack.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={togglePlayPause}>
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextTrack}>
                      <SkipForward size={16} />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Volume</span>
                  <span>{volume}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Available Tracks</p>
                <div className="grid gap-2">
                  {availableTracks.map((track) => (
                    <Card
                      key={track.id}
                      className={`cursor-pointer transition-colors ${
                        currentTrack?.id === track.id
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => playTrack(track)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{track.name}</p>
                            <p className="text-xs text-muted-foreground">{track.description}</p>
                          </div>
                          {currentTrack?.id === track.id && isPlaying && (
                            <Badge variant="secondary">Playing</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}