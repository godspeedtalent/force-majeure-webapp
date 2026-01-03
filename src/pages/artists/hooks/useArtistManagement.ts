/**
 * useArtistManagement
 *
 * Consolidates all state and handlers for the artist management page.
 * Handles artist data fetching, form state, auto-save, and recordings.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { useArtistGenres, useUpdateArtistGenres } from '@/features/artists/hooks/useArtistGenres';
import {
  useArtistRecordings,
  useCreateRecording,
  useUpdateRecording,
  useDeleteRecording,
  useSetPrimaryRecording,
  type ArtistRecording,
  type CreateRecordingData,
} from '@/shared/api/queries/recordingQueries';
import type { Genre } from '@/features/artists/types';

// Types for social links (stored in spotify_data JSON field)
interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

interface ArtistMetadata {
  socialLinks?: SocialLinks;
}

export type ArtistTab = 'overview' | 'music' | 'social' | 'gallery' | 'view';

export interface UseArtistManagementOptions {
  artistId: string | undefined;
}

export function useArtistManagement({ artistId }: UseArtistManagementOptions) {
  const { t: tToast } = useTranslation('toasts');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // UI State
  const [activeTab, setActiveTab] = useState<ArtistTab>('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state - Overview
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');

  // Form state - Genres
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  // Form state - Social Links (stored in dedicated columns)
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [spotify, setSpotify] = useState('');
  // Additional social links (stored in spotify_data JSON)
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');

  // Recording modal state
  const [isAddRecordingModalOpen, setIsAddRecordingModalOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<ArtistRecording | null>(null);
  const [recordingToDelete, setRecordingToDelete] = useState<ArtistRecording | null>(null);

  // Hooks for genre management
  const { data: artistGenres } = useArtistGenres(artistId);
  const updateGenresMutation = useUpdateArtistGenres();

  // Hooks for recording management
  const { data: recordings = [], isLoading: isRecordingsLoading } = useArtistRecordings(artistId);
  const createRecordingMutation = useCreateRecording();
  const updateRecordingMutation = useUpdateRecording();
  const deleteRecordingMutation = useDeleteRecording();
  const setPrimaryMutation = useSetPrimaryRecording();

  // Build metadata object for saving (social links only)
  const buildMetadata = useCallback((): ArtistMetadata => ({
    socialLinks: {
      instagram: instagram || undefined,
      twitter: twitter || undefined,
      facebook: facebook || undefined,
      tiktok: tiktok || undefined,
      youtube: youtube || undefined,
    },
  }), [instagram, twitter, facebook, tiktok, youtube]);

  // Debounced auto-save for artist changes
  const saveArtistData = useCallback(async (data: {
    name: string;
    bio: string;
    website: string;
    spotify_data: ArtistMetadata;
  }) => {
    if (!artistId) return;

    try {
      const { error } = await supabase
        .from('artists')
        .update({
          name: data.name,
          bio: data.bio,
          website: data.website,
          instagram_handle: instagram || null,
          tiktok_handle: tiktok || null,
          soundcloud_id: soundcloud || null,
          spotify_id: spotify || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spotify_data: data.spotify_data as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);

      if (error) throw error;

      toast.success(tToast('artists.autoSaved'));
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    } catch (error) {
      await handleError(error, {
        title: tToast('artists.autoSaveFailed'),
        description: tToast('artists.autoSaveFailedDescription'),
        endpoint: 'ArtistManagement',
        method: 'UPDATE',
      });
    }
  }, [artistId, instagram, tiktok, soundcloud, spotify, tToast, queryClient]);

  const { triggerSave: triggerArtistSave, flushSave: flushArtistSave } =
    useDebouncedSave({
      saveFn: saveArtistData,
      delay: 2000,
    });

  // Helper to trigger auto-save
  const triggerAutoSave = useCallback(() => {
    if (name.trim()) {
      triggerArtistSave({
        name,
        bio,
        website,
        spotify_data: buildMetadata(),
      });
    }
  }, [name, bio, website, buildMetadata, triggerArtistSave]);

  // Fetch artist data
  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      if (!artistId) throw new Error('No artist ID provided');

      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });

  // Populate form state from artist data
  useEffect(() => {
    if (artist) {
      setName(artist.name || '');
      setBio(artist.bio || '');
      setWebsite(artist.website || '');

      // Populate social links from dedicated columns
      setInstagram(artist.instagram_handle || '');
      setTiktok(artist.tiktok_handle || '');
      setSoundcloud(artist.soundcloud_id || '');
      setSpotify(artist.spotify_id || '');

      // Parse additional social links from spotify_data field
      const metadata = artist.spotify_data as ArtistMetadata | null;
      if (metadata?.socialLinks) {
        setTwitter(metadata.socialLinks.twitter || '');
        setFacebook(metadata.socialLinks.facebook || '');
        setYoutube(metadata.socialLinks.youtube || '');
      }
    }
  }, [artist]);

  // Populate genres from artist_genres table
  useEffect(() => {
    if (artistGenres) {
      const genres: Genre[] = artistGenres.map(ag => ag.genre);
      setSelectedGenres(genres);
    }
  }, [artistGenres]);

  // Handle genre changes
  const handleGenreChange = useCallback((genres: Genre[]) => {
    setSelectedGenres(genres);
    if (artistId) {
      updateGenresMutation.mutate({
        artistId,
        genreSelections: genres.map((g, index) => ({
          genreId: g.id,
          isPrimary: index === 0,
        })),
      });
    }
  }, [artistId, updateGenresMutation]);

  // Recording handlers
  const handleAddRecording = useCallback((data: CreateRecordingData) => {
    if (!artistId) return;
    createRecordingMutation.mutate(data, {
      onSuccess: () => {
        toast.success(tToast('artists.recordingAdded', { trackName: data.name }));
        setIsAddRecordingModalOpen(false);
      },
      onError: (error) => {
        handleError(error, { title: tToast('artists.recordingAddFailed') });
      },
    });
  }, [artistId, createRecordingMutation, tToast]);

  const handleEditRecording = useCallback((recording: ArtistRecording) => {
    setEditingRecording(recording);
  }, []);

  const handleUpdateRecording = useCallback((recordingId: string, data: Partial<CreateRecordingData>) => {
    if (!artistId) return;
    updateRecordingMutation.mutate(
      { recordingId, artistId, data },
      {
        onSuccess: () => {
          toast.success(tToast('artists.recordingUpdated'));
          setEditingRecording(null);
        },
        onError: (error) => {
          handleError(error, { title: tToast('artists.recordingUpdateFailed') });
        },
      }
    );
  }, [artistId, updateRecordingMutation, tToast]);

  const handleDeleteRecording = useCallback((recording: ArtistRecording) => {
    setRecordingToDelete(recording);
  }, []);

  const confirmDeleteRecording = useCallback(() => {
    if (!artistId || !recordingToDelete) return;
    deleteRecordingMutation.mutate(
      { recordingId: recordingToDelete.id, artistId },
      {
        onSuccess: () => {
          toast.success(tToast('artists.recordingDeleted'));
          setRecordingToDelete(null);
        },
        onError: (error) => {
          handleError(error, { title: tToast('artists.recordingDeleteFailed') });
        },
      }
    );
  }, [artistId, recordingToDelete, deleteRecordingMutation, tToast]);

  const handleSetPrimaryRecording = useCallback((recording: ArtistRecording) => {
    if (!artistId) return;
    setPrimaryMutation.mutate(
      { recordingId: recording.id, artistId },
      {
        onSuccess: () => {
          toast.success(tToast('artists.recordingSetAsPrimary'));
        },
        onError: (error) => {
          handleError(error, { title: tToast('artists.recordingSetPrimaryFailed') });
        },
      }
    );
  }, [artistId, setPrimaryMutation, tToast]);

  const handleRefetchRecording = useCallback(async (recording: ArtistRecording) => {
    try {
      const url = recording.url;
      const platform = recording.platform;

      let metadata: { name: string; cover_art?: string } | null = null;

      if (platform === 'spotify') {
        const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (response.ok) {
          const data = await response.json();
          const [name] = data.title?.split(' - ') || [data.title];
          metadata = { name: name || recording.name, cover_art: data.thumbnail_url };
        }
      } else if (platform === 'soundcloud') {
        const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (response.ok) {
          const data = await response.json();
          let name = data.title || recording.name;
          if (name.includes(' by ')) {
            name = name.split(' by ')[0];
          }
          metadata = { name, cover_art: data.thumbnail_url };
        }
      }

      if (metadata && artistId) {
        updateRecordingMutation.mutate(
          {
            recordingId: recording.id,
            artistId,
            data: { name: metadata.name, cover_art: metadata.cover_art },
          },
          {
            onSuccess: () => {
              toast.success(tToast('artists.recordingRefetched'));
            },
            onError: (error) => {
              handleError(error, { title: tToast('artists.recordingRefetchFailed') });
            },
          }
        );
      } else {
        toast.error(tToast('artists.recordingRefetchFailed'));
      }
    } catch (error) {
      logger.error('Error refetching recording metadata', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ArtistManagement',
        recordingId: recording.id,
      });
      toast.error(tToast('artists.recordingRefetchFailed'));
    }
  }, [artistId, updateRecordingMutation, tToast]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!artistId) return;

    setIsSaving(true);
    try {
      await flushArtistSave();

      const { error } = await supabase
        .from('artists')
        .update({
          name,
          bio,
          website,
          instagram_handle: instagram || null,
          tiktok_handle: tiktok || null,
          soundcloud_id: soundcloud || null,
          spotify_id: spotify || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spotify_data: buildMetadata() as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);

      if (error) throw error;

      toast.success(tToast('artists.updated'));
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    } catch (error) {
      handleError(error, { title: tToast('artists.updateFailed') });
    } finally {
      setIsSaving(false);
    }
  }, [artistId, name, bio, website, instagram, tiktok, soundcloud, spotify, buildMetadata, flushArtistSave, queryClient, tToast]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!artistId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('artists').delete().eq('id', artistId);

      if (error) throw error;

      toast.success(tToast('artists.deleted'));
      setShowDeleteConfirm(false);
      navigate('/developer/database?table=artists');
    } catch (error) {
      handleError(error, { title: tToast('artists.deleteFailed') });
    } finally {
      setIsDeleting(false);
    }
  }, [artistId, navigate, tToast]);

  // Tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'view' && artist?.id) {
      navigate(`/artists/${artist.id}`);
    } else {
      setActiveTab(tabId as ArtistTab);
    }
  }, [artist?.id, navigate]);

  return {
    // Artist data
    artist,
    isLoading,

    // UI State
    activeTab,
    setActiveTab,
    isDeleting,
    isSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,

    // Form state - Overview
    name,
    setName,
    bio,
    setBio,
    website,
    setWebsite,

    // Form state - Genres
    selectedGenres,
    handleGenreChange,

    // Form state - Social Links
    instagram,
    setInstagram,
    tiktok,
    setTiktok,
    soundcloud,
    setSoundcloud,
    spotify,
    setSpotify,
    twitter,
    setTwitter,
    facebook,
    setFacebook,
    youtube,
    setYoutube,

    // Recording state
    recordings,
    isRecordingsLoading,
    isAddRecordingModalOpen,
    setIsAddRecordingModalOpen,
    editingRecording,
    setEditingRecording,
    recordingToDelete,
    setRecordingToDelete,
    deleteRecordingMutation,

    // Auto-save
    triggerAutoSave,

    // Handlers
    handleSave,
    handleDelete,
    handleDeleteClick: () => setShowDeleteConfirm(true),
    handleTabChange,

    // Recording handlers
    handleAddRecording,
    handleEditRecording,
    handleUpdateRecording,
    handleDeleteRecording,
    confirmDeleteRecording,
    handleSetPrimaryRecording,
    handleRefetchRecording,
  };
}
