import { useState, useCallback, useMemo } from 'react';
import type { Genre } from '@/features/artists/types';
import {
  ArtistFormState,
  ArtistBasicInfo,
  SocialLinks,
  ArtistTrack,
  ArtistMetadata,
  ArtistSaveData,
  createInitialArtistFormState,
} from '../types/artistForm';

interface Artist {
  id: string;
  name: string | null;
  bio: string | null;
  website: string | null;
  image_url: string | null;
  spotify_data: ArtistMetadata | null;
}

interface UseArtistFormStateOptions {
  onAutoSave?: (data: ArtistSaveData) => void;
}

/**
 * useArtistFormState
 *
 * Consolidated state management for artist forms.
 * Replaces 19 individual useState calls with a single, well-structured hook.
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   updateBasic,
 *   updateSocial,
 *   updateGenres,
 *   addTrack,
 *   removeTrack,
 *   initializeFromArtist,
 * } = useArtistFormState({
 *   onAutoSave: (data) => triggerSave(data),
 * });
 * ```
 */
export function useArtistFormState(options: UseArtistFormStateOptions = {}) {
  const { onAutoSave } = options;

  const [state, setState] = useState<ArtistFormState>(createInitialArtistFormState);

  // Build metadata object for saving
  const buildMetadata = useCallback((currentState: ArtistFormState): ArtistMetadata => {
    const socialLinks: Partial<SocialLinks> = {};

    if (currentState.social.instagram) socialLinks.instagram = currentState.social.instagram;
    if (currentState.social.twitter) socialLinks.twitter = currentState.social.twitter;
    if (currentState.social.facebook) socialLinks.facebook = currentState.social.facebook;
    if (currentState.social.tiktok) socialLinks.tiktok = currentState.social.tiktok;
    if (currentState.social.youtube) socialLinks.youtube = currentState.social.youtube;

    return {
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      tracks: currentState.music.tracks.length > 0 ? currentState.music.tracks : undefined,
    };
  }, []);

  // Build save data object
  const buildSaveData = useCallback((currentState: ArtistFormState): ArtistSaveData => ({
    name: currentState.basic.name,
    bio: currentState.basic.bio,
    website: currentState.basic.website,
    image_url: currentState.basic.imageUrl,
    spotify_data: buildMetadata(currentState),
  }), [buildMetadata]);

  // Trigger auto-save if callback provided
  const triggerAutoSave = useCallback((newState: ArtistFormState) => {
    if (onAutoSave && newState.basic.name.trim()) {
      onAutoSave(buildSaveData(newState));
    }
  }, [onAutoSave, buildSaveData]);

  // Initialize form state from artist data
  const initializeFromArtist = useCallback((artist: Artist | null | undefined) => {
    if (!artist) return;

    const metadata = artist.spotify_data as ArtistMetadata | null;

    setState({
      basic: {
        name: artist.name || '',
        bio: artist.bio || '',
        website: artist.website || '',
        imageUrl: artist.image_url || '',
      },
      social: {
        instagram: metadata?.socialLinks?.instagram || '',
        twitter: metadata?.socialLinks?.twitter || '',
        facebook: metadata?.socialLinks?.facebook || '',
        tiktok: metadata?.socialLinks?.tiktok || '',
        youtube: metadata?.socialLinks?.youtube || '',
      },
      music: {
        tracks: metadata?.tracks || [],
        isAddTrackModalOpen: false,
        editingTrack: null,
      },
      genres: [], // Genres are loaded separately
    });
  }, []);

  // Update basic info field
  const updateBasic = useCallback(<K extends keyof ArtistBasicInfo>(
    field: K,
    value: ArtistBasicInfo[K]
  ) => {
    setState(prev => {
      const newState = {
        ...prev,
        basic: { ...prev.basic, [field]: value },
      };
      triggerAutoSave(newState);
      return newState;
    });
  }, [triggerAutoSave]);

  // Update social link field
  const updateSocial = useCallback(<K extends keyof SocialLinks>(
    field: K,
    value: string
  ) => {
    // Strip @ prefix if included
    const cleanedValue = value.replace(/^@/, '');
    setState(prev => {
      const newState = {
        ...prev,
        social: { ...prev.social, [field]: cleanedValue },
      };
      triggerAutoSave(newState);
      return newState;
    });
  }, [triggerAutoSave]);

  // Update genres
  const updateGenres = useCallback((genres: Genre[]) => {
    setState(prev => ({
      ...prev,
      genres,
    }));
    // Note: Genres are saved separately via updateGenresMutation, not auto-saved
  }, []);

  // Add a track
  const addTrack = useCallback((track: ArtistTrack) => {
    setState(prev => {
      const newState = {
        ...prev,
        music: {
          ...prev.music,
          tracks: [...prev.music.tracks, track],
          isAddTrackModalOpen: false,
        },
      };
      triggerAutoSave(newState);
      return newState;
    });
  }, [triggerAutoSave]);

  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        music: {
          ...prev.music,
          tracks: prev.music.tracks.filter(t => t.id !== trackId),
        },
      };
      triggerAutoSave(newState);
      return newState;
    });
  }, [triggerAutoSave]);

  // Update a track
  const updateTrack = useCallback((updatedTrack: ArtistTrack) => {
    setState(prev => {
      const newState = {
        ...prev,
        music: {
          ...prev.music,
          tracks: prev.music.tracks.map(t =>
            t.id === updatedTrack.id ? updatedTrack : t
          ),
          editingTrack: null,
        },
      };
      triggerAutoSave(newState);
      return newState;
    });
  }, [triggerAutoSave]);

  // Increment track click count
  const incrementTrackClick = useCallback((trackId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        music: {
          ...prev.music,
          tracks: prev.music.tracks.map(t =>
            t.id === trackId
              ? { ...t, clickCount: (t.clickCount || 0) + 1 }
              : t
          ),
        },
      };
      triggerAutoSave(newState);
      return newState;
    });
  }, [triggerAutoSave]);

  // Modal state helpers
  const openAddTrackModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      music: { ...prev.music, isAddTrackModalOpen: true },
    }));
  }, []);

  const closeAddTrackModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      music: { ...prev.music, isAddTrackModalOpen: false },
    }));
  }, []);

  const setEditingTrack = useCallback((track: ArtistTrack | null) => {
    setState(prev => ({
      ...prev,
      music: { ...prev.music, editingTrack: track },
    }));
  }, []);

  // Memoized save data for current state
  const saveData = useMemo(() => buildSaveData(state), [state, buildSaveData]);

  // Validation
  const isValid = useMemo(() => {
    return state.basic.name.trim().length > 0;
  }, [state.basic.name]);

  return {
    // State
    state,
    saveData,
    isValid,

    // Initialization
    initializeFromArtist,

    // Basic info updates
    updateBasic,

    // Social updates
    updateSocial,

    // Genre updates
    updateGenres,

    // Track management
    addTrack,
    removeTrack,
    updateTrack,
    incrementTrackClick,

    // Modal helpers
    openAddTrackModal,
    closeAddTrackModal,
    setEditingTrack,
  };
}
