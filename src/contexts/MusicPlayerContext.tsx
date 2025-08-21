import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export interface Song {
  id: string;
  song_name: string;
  artist_id: string;
  artist_name: string;
  streaming_link: string;
  music_source: 'spotify' | 'soundcloud' | 'youtube' | 'apple_music';
  duration?: number;
  is_preview: boolean;
}

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  bio?: string;
  image_url?: string;
  social_links?: Record<string, string>;
}

interface MusicPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  isPlayerVisible: boolean;
  isExpanded: boolean;
}

interface MusicPlayerContextType extends MusicPlayerState {
  playSong: (song: Song) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  togglePlayer: () => void;
  toggleExpanded: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [state, setState] = useState<MusicPlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    queue: [],
    currentIndex: 0,
    isShuffled: false,
    repeatMode: 'none',
    isPlayerVisible: false,
    isExpanded: false,
  });

  const playSong = useCallback((song: Song) => {
    setState(prev => ({
      ...prev,
      currentSong: song,
      queue: [song],
      currentIndex: 0,
      isPlayerVisible: true,
      isPlaying: true,
    }));
  }, []);

  const playQueue = useCallback((songs: Song[], startIndex = 0) => {
    setState(prev => ({
      ...prev,
      queue: songs,
      currentIndex: startIndex,
      currentSong: songs[startIndex] || null,
      isPlayerVisible: true,
      isPlaying: true,
    }));
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const nextSong = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0) return prev;
      
      let nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.queue.length) {
        if (prev.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return { ...prev, isPlaying: false };
        }
      }
      
      return {
        ...prev,
        currentIndex: nextIndex,
        currentSong: prev.queue[nextIndex],
      };
    });
  }, []);

  const previousSong = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0) return prev;
      
      let prevIndex = prev.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = prev.queue.length - 1;
      }
      
      return {
        ...prev,
        currentIndex: prevIndex,
        currentSong: prev.queue[prevIndex],
      };
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const setRepeatMode = useCallback((mode: 'none' | 'one' | 'all') => {
    setState(prev => ({ ...prev, repeatMode: mode }));
  }, []);

  const togglePlayer = useCallback(() => {
    setState(prev => ({ ...prev, isPlayerVisible: !prev.isPlayerVisible }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const value: MusicPlayerContextType = {
    ...state,
    playSong,
    playQueue,
    togglePlay,
    nextSong,
    previousSong,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeatMode,
    togglePlayer,
    toggleExpanded,
    audioRef,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};