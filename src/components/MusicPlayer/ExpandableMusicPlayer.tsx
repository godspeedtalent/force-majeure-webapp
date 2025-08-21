import React, { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { PlayerControls } from './PlayerControls';
import { TrackInfo } from './TrackInfo';
import { VolumeControl } from './VolumeControl';
import { TrackQueue } from './TrackQueue';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Music } from 'lucide-react';

export const ExpandableMusicPlayer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    audioRef,
  } = useMusicPlayer();

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  if (!currentSong) {
    return (
      <div className="mt-auto border-t border-border">
        <div className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Music className="w-5 h-5" />
            <span className="text-sm">No track playing</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t border-border bg-background/50 backdrop-blur-sm">
      {/* Expand/Collapse Handle */}
      <div className="px-4 py-2 border-b border-border/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Now Playing</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsed View */}
      {!isExpanded && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrackInfo showArtworkOnly />
            <div className="flex-1 min-w-0">
              <TrackInfo showDetailsOnly />
            </div>
          </div>
          <PlayerControls />
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Album Art */}
          <div className="flex justify-center">
            <TrackInfo showArtworkOnly />
          </div>

          {/* Track Info */}
          <div className="text-center">
            <TrackInfo showDetailsOnly />
          </div>

          {/* Controls */}
          <PlayerControls />

          {/* Volume Control */}
          <VolumeControl />

          {/* Queue */}
          <div className="max-h-48 overflow-y-auto">
            <TrackQueue />
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentSong?.streaming_link}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
};