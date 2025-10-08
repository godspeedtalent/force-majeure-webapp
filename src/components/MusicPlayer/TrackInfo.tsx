import { Music } from 'lucide-react';
import React from 'react';

import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface TrackInfoProps {
  showArtworkOnly?: boolean;
  showDetailsOnly?: boolean;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({
  showArtworkOnly,
  showDetailsOnly,
}) => {
  const { currentSong } = useMusicPlayer();
  if (!currentSong) {
    if (showArtworkOnly) {
      return (
        <div className='w-16 h-16 rounded-md bg-muted flex items-center justify-center'>
          <Music className='w-8 h-8 text-muted-foreground' />
        </div>
      );
    }
    if (showDetailsOnly) {
      return (
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>No track selected</p>
        </div>
      );
    }
    return (
      <div className='flex-1 flex items-center gap-3 min-w-0'>
        <div className='w-12 h-12 rounded-md bg-muted flex items-center justify-center'>
          <Music className='w-6 h-6 text-muted-foreground' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm text-muted-foreground'>No track selected</p>
        </div>
      </div>
    );
  }
  if (showArtworkOnly) {
    return (
      <div className='w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0'>
        {currentSong?.album_art ? (
          <img
            src={currentSong.album_art}
            alt={currentSong.song_name}
            className='w-full h-full object-cover'
          />
        ) : (
          <Music className='w-8 h-8 text-muted-foreground' />
        )}
      </div>
    );
  }

  if (showDetailsOnly) {
    return (
      <div className='text-left'>
        <h4 className='font-canela font-bold text-base truncate text-foreground'>
          {currentSong.song_name}
        </h4>
        <p className='font-canela font-light text-xs text-muted-foreground truncate mt-0.5'>
          {currentSong.artist_name}
        </p>
      </div>
    );
  }

  return (
    <div className='flex-1 flex items-center gap-3 min-w-0'>
      {/* Track Artwork */}
      <div className='w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0'>
        {currentSong.album_art ? (
          <img
            src={currentSong.album_art}
            alt={currentSong.song_name}
            className='w-full h-full object-cover'
          />
        ) : (
          <Music className='w-6 h-6 text-muted-foreground' />
        )}
      </div>

      {/* Track Details */}
      <div className='flex-1 min-w-0'>
        <h4 className='font-canela font-bold text-sm truncate text-foreground'>
          {currentSong.song_name}
        </h4>
        <div className='flex items-center gap-2 mt-0.5'>
          <p className='font-canela font-light text-[11px] text-muted-foreground truncate'>
            {currentSong.artist_name}
          </p>
        </div>
      </div>
    </div>
  );
};
