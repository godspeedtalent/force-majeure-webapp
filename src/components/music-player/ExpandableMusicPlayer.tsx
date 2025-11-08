import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

import { PlayerControls } from './PlayerControls';
import { TrackInfo } from './TrackInfo';
import { TrackQueue } from './TrackQueue';
import { VolumeControl } from './VolumeControl';

import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export const ExpandableMusicPlayer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentSong } = useMusicPlayer();

  if (!currentSong) {
    return null;
  }

  return (
    <div className='sticky bottom-0 z-50 w-full bg-background/80 backdrop-blur-md border-t border-border'>
      {/* Expand/Collapse Handle */}
      <div className='px-4 py-2 border-b border-border/50'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <span>Now Playing</span>
          {isExpanded ? (
            <ChevronDown className='w-4 h-4' />
          ) : (
            <ChevronUp className='w-4 h-4' />
          )}
        </button>
      </div>

      {/* Collapsed View */}
      {!isExpanded && (
        <div className='p-4'>
          <div className='flex items-center gap-3'>
            <TrackInfo />
            <div className='h-8 w-px bg-border mx-1' />
            <PlayerControls />
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className='p-4 space-y-4'>
          <div className='flex gap-6'>
            {/* Left Column - Now Playing Info and Controls */}
            <div className='flex-1 space-y-4'>
              <div className='space-y-3'>
                <TrackInfo />
                <PlayerControls />
              </div>
            </div>

            {/* Right Column - Queue */}
            <div className='flex-1 min-w-0'>
              <div className='h-48'>
                <h4 className='text-sm font-canela font-medium text-foreground mb-3'>
                  Queue
                </h4>
                <div className='h-40 overflow-y-auto'>
                  <TrackQueue />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Volume Control */}
          <div className='w-full pt-2 border-t border-border/50'>
            <VolumeControl />
          </div>
        </div>
      )}
    </div>
  );
};
