import React, { useState } from 'react';
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
  } = useMusicPlayer();

  if (!currentSong) {
    return (
      <div className="border-t border-border bg-background/50 backdrop-blur-sm">
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
    <div className="w-full border-t border-border bg-background/50 backdrop-blur-sm">
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
          <div className="flex items-center gap-3">
            <TrackInfo />
            <div className="h-8 w-px bg-border mx-1" />
            <PlayerControls />
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Top row with art, info, divider, controls and volume */}
          <div className="flex items-center gap-3">
            <TrackInfo />
            <div className="h-8 w-px bg-border mx-1" />
            <PlayerControls />
            <div className="ml-auto w-56">
              <VolumeControl />
            </div>
          </div>

          {/* Queue */}
          <div className="max-h-48 overflow-y-auto">
            <TrackQueue />
          </div>
        </div>
      )}

    </div>
  );
};