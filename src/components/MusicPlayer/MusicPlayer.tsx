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

  // This popup player is no longer used - using ExpandableMusicPlayer in left column instead
  return null;
};