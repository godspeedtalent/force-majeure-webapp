/**
 * useUserArtist
 *
 * Hook for managing user artist linking, registration, and related requests.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, logger, handleError } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';

// ============================================================================
// Types
// ============================================================================

export interface LinkedArtistGenre {
  genre_id: string;
  genres: { id: string; name: string };
}

export interface LinkedArtist {
  id: string;
  name: string;
  image_url: string | null;
  bio: string | null;
  genre: string | null;
  artist_genres?: LinkedArtistGenre[];
}

export interface UserRequest {
  id: string;
  request_type: 'link_artist' | 'delete_data' | 'unlink_artist';
  status: 'pending' | 'approved' | 'denied';
  parameters: Record<string, unknown> | null;
  denial_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface PendingArtistRegistration {
  id: string;
  artist_name: string;
  bio: string;
  profile_image_url: string | null;
  press_images: string[] | null;
  genres: string[] | null;
  instagram_handle: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  tiktok_handle: string | null;
  spotify_track_url: string | null;
  soundcloud_set_url: string | null;
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
}

export interface ArtistRegistrationWithGenres extends PendingArtistRegistration {
  genreNames: string[];
}

// ============================================================================
// Hook
// ============================================================================

interface UseUserArtistOptions {
  /** Optional user ID to fetch artist data for. Defaults to current logged-in user. */
  userId?: string;
}

export function useUserArtist(options: UseUserArtistOptions = {}) {
  const { t: tToast } = useTranslation('toasts');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { getRoles } = useUserPermissions();

  // Use provided userId or fall back to current user
  const targetUserId = options.userId || currentUser?.id;
  const isOwnProfile = !options.userId || options.userId === currentUser?.id;

  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedArtistToLink, setSelectedArtistToLink] = useState<{ id: string; name: string } | null>(null);

  // Fetch linked artist
  const { data: linkedArtist, isLoading: loadingArtist } = useQuery({
    queryKey: ['user-linked-artist', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('artists')
        .select(`
          id, name, image_url, bio, genre,
          artist_genres(
            genre_id,
            genres:genres(id, name)
          )
        `)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch linked artist', { error: error.message, userId: targetUserId });
        throw error;
      }

      return data as LinkedArtist | null;
    },
    enabled: !!targetUserId,
  });

  // Fetch artist registration (pending, approved, or denied)
  const { data: artistRegistration, isLoading: loadingRegistration } = useQuery({
    queryKey: ['user-artist-registration', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('artist_registrations')
        .select('id, artist_name, bio, profile_image_url, press_images, genres, instagram_handle, spotify_url, soundcloud_url, tiktok_handle, spotify_track_url, soundcloud_set_url, status, submitted_at, reviewed_at, reviewer_notes')
        .eq('user_id', targetUserId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch artist registration', { error: error.message, userId: targetUserId });
        throw error;
      }

      if (!data) return null;

      // Fetch genre names if genre IDs are present
      let genreNames: string[] = [];
      if (data.genres && data.genres.length > 0) {
        const { data: genresData } = await supabase
          .from('genres')
          .select('id, name')
          .in('id', data.genres);

        if (genresData) {
          const genreMap = new Map(genresData.map(g => [g.id, g.name]));
          genreNames = data.genres
            .map(id => genreMap.get(id))
            .filter((name): name is string => !!name);
        }
      }

      return {
        ...data,
        genreNames,
      } as ArtistRegistrationWithGenres;
    },
    enabled: !!targetUserId,
  });

  // Fetch pending requests - only for own profile (sensitive data)
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['user-requests', targetUserId],
    queryFn: async () => {
      if (!targetUserId || !isOwnProfile) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('user_requests')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch user requests', { error: error.message, userId: targetUserId });
        throw error;
      }

      return (data || []) as UserRequest[];
    },
    enabled: !!targetUserId && isOwnProfile,
  });

  // Check for pending delete request
  const pendingDeleteRequest = pendingRequests.find(
    r => r.request_type === 'delete_data' && r.status === 'pending'
  );

  // Check for pending link request
  const pendingLinkRequest = pendingRequests.find(
    r => r.request_type === 'link_artist' && r.status === 'pending'
  );

  // Create link artist request mutation - only for own profile
  const linkArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      if (!currentUser?.id || !isOwnProfile) throw new Error('Not authenticated or not own profile');

      // Check if user already has a pending link request to prevent unique constraint violation
      if (pendingLinkRequest) {
        throw new Error('You already have a pending artist link request. Please wait for it to be reviewed.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_requests')
        .insert({
          user_id: currentUser.id,
          request_type: 'link_artist',
          status: 'pending',
          parameters: { artist_id: artistId },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tToast('userArtist.linkRequestSubmitted'));
      queryClient.invalidateQueries({ queryKey: ['user-requests', targetUserId] });
      setShowLinkModal(false);
      setSelectedArtistToLink(null);
    },
    onError: (error) => {
      // Check for unique constraint violation
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUniqueViolation = errorMessage.includes('unique_pending_request') ||
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('already have a pending');

      if (isUniqueViolation) {
        toast.error(tToast('userArtist.duplicatePendingRequest'));
      } else {
        handleError(error, {
          title: tToast('userArtist.linkRequestFailed'),
          context: 'Creating artist link request',
          endpoint: 'user_requests',
          method: 'INSERT',
          userRole: getRoles().join(', '),
        });
      }
    },
  });

  // Create unlink artist mutation - only for own profile
  const unlinkArtistMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !linkedArtist?.id || !isOwnProfile) throw new Error('No linked artist or not own profile');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artists')
        .update({ user_id: null })
        .eq('id', linkedArtist.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tToast('userArtist.unlinkSuccess'));
      queryClient.invalidateQueries({ queryKey: ['user-linked-artist', targetUserId] });
      setShowUnlinkConfirm(false);
    },
    onError: (error) => {
      handleError(error, {
        title: tToast('userArtist.unlinkFailed'),
        context: 'Unlinking artist from profile',
        endpoint: 'artists',
        method: 'UPDATE',
        userRole: getRoles().join(', '),
      });
    },
  });

  // Create delete data request mutation - only for own profile
  const deleteDataMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !isOwnProfile) throw new Error('Not authenticated or not own profile');

      // Check if user already has a pending delete request
      if (pendingDeleteRequest) {
        throw new Error('You already have a pending data deletion request. Please wait for it to be reviewed.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_requests')
        .insert({
          user_id: currentUser.id,
          request_type: 'delete_data',
          status: 'pending',
          parameters: { artist_id: linkedArtist?.id || null },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tToast('userArtist.deleteRequestSubmitted'));
      queryClient.invalidateQueries({ queryKey: ['user-requests', targetUserId] });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      // Check for unique constraint violation
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUniqueViolation = errorMessage.includes('unique_pending_request') ||
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('already have a pending');

      if (isUniqueViolation) {
        toast.error(tToast('userArtist.duplicatePendingRequest'));
      } else {
        handleError(error, {
          title: tToast('userArtist.deleteRequestFailed'),
          context: 'Creating data deletion request',
          endpoint: 'user_requests',
          method: 'INSERT',
          userRole: getRoles().join(', '),
        });
      }
    },
  });

  const isLoading = loadingArtist || loadingRequests || loadingRegistration;

  return {
    // Data
    linkedArtist,
    artistRegistration,
    pendingRequests,
    pendingDeleteRequest,
    pendingLinkRequest,

    // Profile context
    isOwnProfile,
    targetUserId,

    // Loading states
    isLoading,
    loadingArtist,
    loadingRegistration,
    loadingRequests,

    // Modal states
    showLinkModal,
    setShowLinkModal,
    showUnlinkConfirm,
    setShowUnlinkConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    selectedArtistToLink,
    setSelectedArtistToLink,

    // Mutations
    linkArtistMutation,
    unlinkArtistMutation,
    deleteDataMutation,

    // Navigation
    navigate,
  };
}
