import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PlayerControls: React.FC = () => {
  const {
    isPlaying,
    isShuffled,
    repeatMode,
    togglePlay,
    previousSong,
    nextSong,
    toggleShuffle,
    setRepeatMode,
    queue,
  } = useMusicPlayer();

  const handleRepeatClick = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className="flex items-center gap-2">
      {/* Shuffle Button */}
      <button
        onClick={toggleShuffle}
        className={cn(
          "p-2 rounded-md transition-colors",
          isShuffled 
            ? "text-primary bg-primary/20 hover:bg-primary/30" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
        aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
      >
        <Shuffle className="w-4 h-4" />
      </button>

      {/* Previous Button */}
      <button
        onClick={previousSong}
        disabled={queue.length <= 1}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
        aria-label="Previous track"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Next Button */}
      <button
        onClick={nextSong}
        disabled={queue.length <= 1}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
        aria-label="Next track"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Repeat Button */}
      <button
        onClick={handleRepeatClick}
        className={cn(
          "p-2 rounded-md transition-colors",
          repeatMode !== 'none'
            ? "text-primary bg-primary/20 hover:bg-primary/30"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
        aria-label={`Repeat: ${repeatMode}`}
      >
        <RepeatIcon className="w-4 h-4" />
      </button>
    </div>
  );
};