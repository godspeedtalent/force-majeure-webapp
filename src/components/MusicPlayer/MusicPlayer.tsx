import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { PlayerControls } from './PlayerControls';
import { TrackInfo } from './TrackInfo';
import { VolumeControl } from './VolumeControl';
import { TrackQueue } from './TrackQueue';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const {
    isPlayerVisible,
    isExpanded,
    currentSong,
    toggleExpanded,
  } = useMusicPlayer();

  if (!isPlayerVisible || !currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className={cn(
        "bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg transition-all duration-300 ease-out mx-auto",
        isExpanded ? "w-[680px]" : "w-[560px]"
      )}>
        {/* Single Row: Artwork, Info, Divider, Controls, Expand, Volume */}
        <div className="flex items-center gap-3 px-4 py-3">
          <TrackInfo />
          <div className="h-8 w-px bg-border mx-1" />
          <PlayerControls />
          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpanded}
            className="ml-auto p-2 rounded-md hover:bg-accent/50 transition-colors"
            aria-label={isExpanded ? "Collapse player" : "Expand player"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <div className="w-48">
            <VolumeControl />
          </div>
        </div>

        {/* Expanded Queue View */}
        {isExpanded && (
          <div className="border-t border-border h-76 overflow-hidden">
            <TrackQueue />
          </div>
        )}
      </div>
    </div>
  );
};