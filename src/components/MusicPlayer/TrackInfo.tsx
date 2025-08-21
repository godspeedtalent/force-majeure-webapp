import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';
export const TrackInfo: React.FC = () => {
  const {
    currentSong
  } = useMusicPlayer();
  if (!currentSong) {
    return <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
          <Music className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">No track selected</p>
        </div>
      </div>;
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
  return <div className="flex-1 flex items-center gap-3 min-w-0">
      {/* Track Artwork Placeholder */}
      <div className="w-12 h-12 rounded-md bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
        <Music className="w-6 h-6 text-primary" />
      </div>

      {/* Track Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate text-foreground">
          {currentSong.song_name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground truncate">
            {currentSong.artist_name}
          </p>
          
        </div>
      </div>
    </div>;
};