/**
 * useArtistManagement
 *
 * Consolidates all state and handlers for the artist management page.
 * Handles artist data fetching, form state, and recordings.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
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

  // Track initial values for dirty state detection
  const initialValuesRef = useRef<{
    name: string;
    bio: string;
    website: string;
    instagram: string;
    tiktok: string;
    soundcloud: string;
    spotify: string;
    twitter: string;
    facebook: string;
    youtube: string;
  } | null>(null);

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
      const metadata = artist.spotify_data as ArtistMetadata | null;

      const initialValues = {
        name: artist.name || '',
        bio: artist.bio || '',
        website: artist.website || '',
        instagram: artist.instagram_handle || '',
        tiktok: artist.tiktok_handle || '',
        soundcloud: artist.soundcloud_id || '',
        spotify: artist.spotify_id || '',
        twitter: metadata?.socialLinks?.twitter || '',
        facebook: metadata?.socialLinks?.facebook || '',
        youtube: metadata?.socialLinks?.youtube || '',
      };

      setName(initialValues.name);
      setBio(initialValues.bio);
      setWebsite(initialValues.website);
      setInstagram(initialValues.instagram);
      setTiktok(initialValues.tiktok);
      setSoundcloud(initialValues.soundcloud);
      setSpotify(initialValues.spotify);
      setTwitter(initialValues.twitter);
      setFacebook(initialValues.facebook);
      setYoutube(initialValues.youtube);

      initialValuesRef.current = initialValues;
    }
  }, [artist]);

  // Populate genres from artist_genres table
  useEffect(() => {
    if (artistGenres) {
      const genres: Genre[] = artistGenres.map(ag => ag.genre);
      setSelectedGenres(genres);
    }
  }, [artistGenres]);

  // Calculate if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      name !== initial.name ||
      bio !== initial.bio ||
      website !== initial.website ||
      instagram !== initial.instagram ||
      tiktok !== initial.tiktok ||
      soundcloud !== initial.soundcloud ||
      spotify !== initial.spotify ||
      twitter !== initial.twitter ||
      facebook !== initial.facebook ||
      youtube !== initial.youtube
    );
  }, [name, bio, website, instagram, tiktok, soundcloud, spotify, twitter, facebook, youtube]);

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
      } else if (platform === 'youtube') {
        const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oEmbedUrl);
        if (response.ok) {
          const data = await response.json();
          metadata = { name: data.title || recording.name, cover_art: data.thumbnail_url };
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
      const { error } = await supabase
        .from('artists')
        .update({
          name,
          bio,
          website,
          instagram_handle: instagram || null,
          twitter_handle: twitter || null,
          tiktok_handle: tiktok || null,
          facebook_url: facebook || null,
          youtube_url: youtube || null,
          soundcloud_id: soundcloud || null,
          spotify_id: spotify || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spotify_data: buildMetadata() as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);

      if (error) throw error;

      // Update initial values to reset dirty state
      initialValuesRef.current = {
        name,
        bio,
        website,
        instagram,
        tiktok,
        soundcloud,
        spotify,
        twitter,
        facebook,
        youtube,
      };

      toast.success(tToast('artists.updated'));
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    } catch (error) {
      handleError(error, { title: tToast('artists.updateFailed') });
    } finally {
      setIsSaving(false);
    }
  }, [artistId, name, bio, website, instagram, twitter, tiktok, facebook, youtube, soundcloud, spotify, buildMetadata, queryClient, tToast]);

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
    isDirty,
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
