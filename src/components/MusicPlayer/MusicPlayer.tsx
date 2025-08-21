import React, { useEffect } from 'react';
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
    isPlaying,
    volume,
    isMuted,
    toggleExpanded,
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

  if (!isPlayerVisible || !currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={cn(
        "bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg transition-all duration-300 ease-out",
        isExpanded ? "w-96 h-96" : "w-80 h-auto"
      )}>
        {/* Album Art Row */}
        <div className="flex justify-center p-4 pb-2">
          <TrackInfo showArtworkOnly />
        </div>

        {/* Track Info & Controls Row */}
        <div className="flex items-center gap-3 px-4 pb-2">
          <div className="flex-1">
            <TrackInfo showDetailsOnly />
          </div>
          <PlayerControls />
          
          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpanded}
            className="p-2 rounded-md hover:bg-accent/50 transition-colors"
            aria-label={isExpanded ? "Collapse player" : "Expand player"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Volume Control Row */}
        <div className="px-4 pb-4">
          <VolumeControl />
        </div>

        {/* Expanded Queue View */}
        {isExpanded && (
          <div className="border-t border-border h-76 overflow-hidden">
            <TrackQueue />
          </div>
        )}
      </div>

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