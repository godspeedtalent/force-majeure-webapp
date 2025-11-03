import { Music, Play } from 'lucide-react';
import React from 'react';

import spotifyLogo from '@/assets/spotify-logo.png';
import { Badge } from '@/components/common/shadcn/badge';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { cn } from '@/shared/utils/utils';

export const TrackQueue: React.FC = () => {
  const {
    queue,
    currentIndex: _currentIndex,
    currentSong,
    playSong,
  } = useMusicPlayer();

  if (queue.length === 0) {
    return (
      <div className='p-4 text-center'>
        <Music className='w-8 h-8 text-muted-foreground mx-auto mb-2' />
        <p className='text-sm text-muted-foreground'>No songs in queue</p>
      </div>
    );
  }

  const getMusicSourceColor = (source: string) => {
    switch (source) {
      case 'spotify':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'soundcloud':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'youtube':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'apple_music':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className='space-y-2'>
      {queue.map((song, index) => {
        const isCurrentSong = song.id === currentSong?.id;

        return (
          <div
            key={`${song.id}-${index}`}
            className={cn(
              'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors group',
              isCurrentSong
                ? 'bg-primary/20 border border-primary/30'
                : 'hover:bg-accent/50'
            )}
            onClick={() => playSong(song)}
          >
            {/* Track Number or Play Icon */}
            <div className='w-6 h-6 flex items-center justify-center text-xs'>
              {isCurrentSong ? (
                <Play className='w-3 h-3 text-primary' />
              ) : (
                <span className='text-muted-foreground group-hover:text-foreground'>
                  {index + 1}
                </span>
              )}
            </div>

            {/* Track Info */}
            <div className='flex-1 min-w-0'>
              <p
                className={cn(
                  'text-sm truncate font-canela font-medium',
                  isCurrentSong ? 'text-primary' : 'text-foreground'
                )}
              >
                {song.song_name}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <p className='text-xs text-muted-foreground truncate font-canela'>
                  {song.artist_name}
                </p>
                {song.music_source === 'spotify' ? (
                  <img
                    src={spotifyLogo}
                    alt='Spotify'
                    className='w-3 h-3 brightness-0 invert'
                  />
                ) : (
                  <Badge
                    variant='outline'
                    className={`text-xs px-1.5 py-0.5 ${getMusicSourceColor(song.music_source)}`}
                  >
                    {song.music_source}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
