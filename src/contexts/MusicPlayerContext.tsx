import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { SpotifyService } from '@/lib/spotify';

export interface Song {
  id: string;
  song_name: string;
  artist_id: string;
  artist_name: string;
  streaming_link: string;
  music_source: 'spotify' | 'soundcloud' | 'youtube' | 'apple_music';
  duration?: number;
  is_preview: boolean;
  album_art?: string | null;
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

    // Fire-and-forget resolve of album art for Spotify tracks
    (async () => {
      if (song.music_source !== 'spotify' || song.album_art) return;
      try {
        const svc = SpotifyService.getInstance();
        const art = await svc.getAlbumArtUrl(song.streaming_link, 'small');
        if (art) {
          setState(prev => {
            const updated = { ...song, album_art: art };
            return { ...prev, currentSong: updated, queue: [updated] };
          });
        }
      } catch {}
    })();
  }, []);

  const playQueue = useCallback((songs: Song[], startIndex = 0) => {
    // Set initial state immediately for UI responsiveness
    setState(prev => ({
      ...prev,
      queue: songs,
      currentIndex: startIndex,
      currentSong: songs[startIndex] || null,
      isPlayerVisible: true,
      isPlaying: true,
    }));

    // Resolve first playable track and update state
    (async () => {
      const svc = SpotifyService.getInstance();
      let firstPlayableIndex = -1;
  const updated: Song[] = [...songs];

      for (let i = startIndex; i < songs.length; i++) {
        const s = songs[i];
  if (s.music_source === 'spotify') {
          // If already a direct preview URL, take it; else resolve
          let link = s.streaming_link;
          if (!(/p\.scdn\.co\/mp3-preview\//.test(link) || /\.mp3($|\?)/i.test(link))) {
            try {
              const preview = await svc.getPreviewUrl(link);
              if (preview) {
    // also fetch album art lazily
    let art: string | null = null;
    try { art = await svc.getAlbumArtUrl(link, 'small'); } catch {}
    updated[i] = { ...s, streaming_link: preview, album_art: art ?? s.album_art };
                if (firstPlayableIndex === -1) firstPlayableIndex = i;
                break; // we can start with this one; resolve others lazily later
              }
            } catch (e) {
              // continue to next
            }
          } else {
            firstPlayableIndex = i;
            break;
          }
        } else if (/\.mp3($|\?)/i.test(s.streaming_link)) {
          firstPlayableIndex = i;
          break;
        }
      }

      if (firstPlayableIndex !== -1) {
        setState(prev => ({
          ...prev,
          queue: updated,
          currentIndex: firstPlayableIndex,
          currentSong: updated[firstPlayableIndex],
          isPlayerVisible: true,
          isPlaying: true,
        }));

        // try to autoplay if audio is ready
        if (audioRef.current) {
          try { await audioRef.current.play(); } catch {}
        }
      } else {
        // No playable tracks; stop playing
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    })();
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    const audio = audioRef.current;
    if (!audio) return;
    // Defer to next microtask so state updates propagate but respond quickly
    queueMicrotask(() => {
      if (state.isPlaying) {
        // was playing, so pause
        audio.pause();
      } else {
        // was paused, so play
        audio.play().catch(() => {});
      }
    });
  }, [audioRef, state.isPlaying]);

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
    // If we were playing, attempt to continue playing next track
    const a = audioRef.current;
    if (a && state.isPlaying) {
      queueMicrotask(() => {
        a.play().catch(() => {});
      });
    }
  }, []);

  const previousSong = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 2) {
      audio.currentTime = 0;
      // if currently playing, keep it playing
      setState(prev => ({ ...prev }));
      if (state.isPlaying) {
        audio.play().catch(() => {});
      }
      return;
    }

    setState(prev => {
      if (prev.queue.length === 0) return prev;
      let prevIndex = prev.currentIndex - 1;
      if (prevIndex < 0) prevIndex = prev.queue.length - 1;
      return {
        ...prev,
        currentIndex: prevIndex,
        currentSong: prev.queue[prevIndex],
        // maintain play state; if playing, next effect will auto-play
      };
    });
  }, [audioRef, state.isPlaying]);

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

  // Resolve Spotify streaming links to preview URLs just-in-time
  useEffect(() => {
    const resolveAndPlay = async () => {
      const current = state.currentSong;
      if (!current) return;
      if (current.music_source !== 'spotify') return;
      // If it already looks like a preview mp3, skip
      if (/p\.scdn\.co\/mp3-preview\//.test(current.streaming_link) || /\.mp3($|\?)/i.test(current.streaming_link)) {
        // ensure autoplay
        if (audioRef.current && state.isPlaying) {
          const a = audioRef.current;
          try {
            await a.play();
          } catch {}
        }
        // Ensure album art is present
        if (!current.album_art) {
          try {
            const svc = SpotifyService.getInstance();
            const art = await svc.getAlbumArtUrl(current.streaming_link, 'small');
            if (art) {
              setState(prev => {
                if (!prev.currentSong || prev.currentSong.id !== current.id) return prev;
                const updatedSong = { ...prev.currentSong, album_art: art };
                const updatedQueue = prev.queue.map(s => s.id === updatedSong.id ? updatedSong : s);
                return { ...prev, currentSong: updatedSong, queue: updatedQueue };
              });
            }
          } catch {}
        }
        return;
      }

      const svc = SpotifyService.getInstance();
      try {
        const preview = await svc.getPreviewUrl(current.streaming_link);
        if (preview) {
          // update just the currentSong's streaming_link to the preview URL
          setState(prev => {
            if (!prev.currentSong) return prev;
            if (prev.currentSong.id !== current.id) return prev; // race guard
            const updatedSong = { ...prev.currentSong!, streaming_link: preview };
            const updatedQueue = prev.queue.map(s => s.id === updatedSong.id ? updatedSong : s);
            return { ...prev, currentSong: updatedSong, queue: updatedQueue };
          });
          // After state update, attempt autoplay
          if (audioRef.current && state.isPlaying) {
            try { await audioRef.current.play(); } catch {}
          }
          // Fetch album art if missing
          try {
            const svc = SpotifyService.getInstance();
            const art = await svc.getAlbumArtUrl(current.streaming_link, 'small');
            if (art) {
              setState(prev => {
                if (!prev.currentSong || prev.currentSong.id !== current.id) return prev;
                const updatedSong = { ...prev.currentSong!, album_art: art };
                const updatedQueue = prev.queue.map(s => s.id === updatedSong.id ? updatedSong : s);
                return { ...prev, currentSong: updatedSong, queue: updatedQueue };
              });
            }
          } catch {}
        }
      } catch (e) {
        console.error('Failed to resolve Spotify preview URL', e);
      }
    };

    resolveAndPlay();
    // We only want to run when the song changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSong]);

  // Hook up audio element events for autoplay next
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setState(prev => {
        if (prev.repeatMode === 'one') {
          // restart current track
          audio.currentTime = 0;
          audio.play().catch(() => {});
          return prev;
        }

        if (prev.queue.length === 0) return { ...prev, isPlaying: false };
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
          isPlaying: true,
        };
      });
    };

    const onError = () => {
      // Skip to next track on error (e.g., no preview available)
      setState(prev => {
        if (prev.queue.length === 0) return { ...prev, isPlaying: false };
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
          isPlaying: true,
        };
      });
    };

    const onCanPlay = () => {
      if (state.isPlaying) {
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [audioRef, state.isPlaying]);

  // Sync play/pause with state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.currentSong && state.isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [state.isPlaying, state.currentSong]);

  // Sync volume and mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.isMuted ? 0 : state.volume;
  }, [state.volume, state.isMuted]);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {/* Single hidden audio element owned by the provider to avoid duplicate refs */}
      <audio
        ref={audioRef}
        src={state.currentSong?.streaming_link}
        preload="metadata"
        className="hidden"
      />
    </MusicPlayerContext.Provider>
  );
};