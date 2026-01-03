/**
 * useArtistRegistrations
 *
 * Hook for managing artist registration data and actions (approve, deny, delete).
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { RoleManagementService } from '@/shared/services/roleManagementService';
import { ROLES } from '@/shared/auth/permissions';

// ============================================================================
// Types
// ============================================================================

export interface ArtistRegistration {
  id: string;
  user_id: string | null;
  artist_name: string;
  email: string | null;
  bio: string;
  genres: string[] | null;
  instagram_handle: string | null;
  soundcloud_url: string | null;
  soundcloud_id: string | null;
  soundcloud_set_url: string | null;
  spotify_url: string | null;
  spotify_id: string | null;
  spotify_track_url: string | null;
  tiktok_handle: string | null;
  profile_image_url: string | null;
  press_images: string[] | null;
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  paid_show_count_group: string | null;
  talent_differentiator: string | null;
  crowd_sources: string | null;
  city_id: string | null;
  city?: { name: string; state: string } | null;
  tracks_metadata?: Array<{
    name: string;
    url: string;
    coverArt: string | null;
    platform: string;
    recordingType: 'track' | 'dj_set';
  }> | null;
}

export type StatusFilter = 'all' | 'pending' | 'approved' | 'denied';

// ============================================================================
// Data Hook
// ============================================================================

export function useArtistRegistrationsData(statusFilter: StatusFilter) {
  // Fetch registrations
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['artist-registrations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('artist_registrations')
        .select(`
          *,
          city:cities!city_id(name, state)
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch artist registrations', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      return (data ?? []) as ArtistRegistration[];
    },
  });

  // Fetch all genres for name lookup
  const { data: genresMap = new Map() } = useQuery({
    queryKey: ['genres-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('id, name');

      if (error) {
        logger.error('Failed to fetch genres', { error: error.message });
        return new Map<string, string>();
      }

      return new Map(data.map(g => [g.id, g.name]));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch pending count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['artist-registrations-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artist_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count ?? 0;
    },
  });

  return {
    registrations,
    isLoading,
    genresMap,
    pendingCount,
  };
}

// ============================================================================
// Actions Hook
// ============================================================================

export function useArtistRegistrationActions() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['artist-registrations'] });
    queryClient.invalidateQueries({ queryKey: ['artist-registrations-pending-count'] });
    queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
    queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
    queryClient.invalidateQueries({ queryKey: ['recordings-count'] });
    queryClient.invalidateQueries({ queryKey: ['artists'] });
  };

  /**
   * Approve a registration - creates artist record and links to user
   */
  const handleApprove = async (registration: ArtistRegistration, reviewerNotes: string) => {
    // Step 0: Re-fetch the registration fresh to avoid stale data
    const { data: freshRegistration, error: fetchError } = await supabase
      .from('artist_registrations')
      .select('*')
      .eq('id', registration.id)
      .single();

    if (fetchError || !freshRegistration) {
      logger.error('Failed to fetch fresh registration data', {
        error: fetchError?.message,
        source: 'useArtistRegistrations',
        details: { registrationId: registration.id },
      });
      throw fetchError || new Error('Registration not found');
    }

    const reg = freshRegistration;

    // Step 1: Create the artist record from registration data
    const instagramHandle = reg.instagram_handle?.trim() || null;
    const tiktokHandle = reg.tiktok_handle?.trim() || null;
    const soundcloudId = reg.soundcloud_id?.trim() || reg.soundcloud_url?.trim() || null;
    const spotifyId = reg.spotify_id?.trim() || reg.spotify_url?.trim() || null;

    const { data: newArtist, error: artistError } = await supabase
      .from('artists')
      .insert({
        name: reg.artist_name,
        bio: reg.bio || null,
        image_url: reg.profile_image_url || null,
        city_id: reg.city_id || null,
        user_id: reg.user_id || null,
        soundcloud_id: soundcloudId,
        spotify_id: spotifyId,
        instagram_handle: instagramHandle,
        tiktok_handle: tiktokHandle,
      })
      .select('id')
      .single();

    if (artistError) {
      logger.error('Failed to create artist from registration', {
        error: artistError.message,
        source: 'useArtistRegistrations',
        details: {
          registrationId: reg.id,
          pgDetails: artistError.details,
          pgHint: artistError.hint,
          pgCode: artistError.code,
        },
      });
      throw artistError;
    }

    logger.info('Artist created from registration', {
      source: 'useArtistRegistrations',
      details: { artistId: newArtist.id, registrationId: reg.id },
    });

    // Step 2: Create artist_genres entries
    const genreIds = reg.genres as string[] | null;
    if (genreIds && genreIds.length > 0) {
      const genreEntries = genreIds.map((genreId: string, index: number) => ({
        artist_id: newArtist.id,
        genre_id: genreId,
        is_primary: index === 0,
      }));

      const { error: genresError } = await supabase
        .from('artist_genres')
        .insert(genreEntries);

      if (genresError) {
        logger.warn('Failed to create artist genres from registration', {
          error: genresError.message,
          source: 'useArtistRegistrations',
          details: { artistId: newArtist.id, registrationId: reg.id, genreIds },
        });
      }
    }

    // Step 3: Update the registration status to approved
    const { error: updateError } = await supabase
      .from('artist_registrations')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
        reviewer_notes: reviewerNotes || null,
      })
      .eq('id', reg.id);

    if (updateError) {
      logger.error('Failed to update registration status after artist creation', {
        error: updateError.message,
        source: 'useArtistRegistrations',
        details: { registrationId: reg.id, artistId: newArtist.id },
      });
      throw updateError;
    }

    // Step 4: Create artist recordings from tracks_metadata
    const tracksMetadata = reg.tracks_metadata as ArtistRegistration['tracks_metadata'];

    if (tracksMetadata && tracksMetadata.length > 0) {
      const recordingsToCreate = tracksMetadata.map((track, index) => ({
        artist_id: newArtist.id,
        name: track.name || `${reg.artist_name} - Recording ${index + 1}`,
        url: track.url,
        platform: track.platform,
        cover_art: track.coverArt || null,
        is_primary_dj_set: track.recordingType === 'dj_set' && index === 0,
      }));

      const { error: recordingsError } = await supabase
        .from('artist_recordings')
        .insert(recordingsToCreate);

      if (recordingsError) {
        logger.warn('Failed to create artist recordings from registration', {
          error: recordingsError.message,
          source: 'useArtistRegistrations',
        });
      }
    } else {
      // Fallback: Use legacy URL fields
      const legacyRecordings: Array<{
        artist_id: string;
        name: string;
        url: string;
        platform: string;
        is_primary_dj_set: boolean;
      }> = [];

      if (reg.soundcloud_set_url) {
        legacyRecordings.push({
          artist_id: newArtist.id,
          name: `${reg.artist_name} - DJ Set`,
          url: reg.soundcloud_set_url,
          platform: 'soundcloud',
          is_primary_dj_set: true,
        });
      }
      if (reg.spotify_track_url) {
        legacyRecordings.push({
          artist_id: newArtist.id,
          name: `${reg.artist_name} - Track`,
          url: reg.spotify_track_url,
          platform: 'spotify',
          is_primary_dj_set: false,
        });
      }

      if (legacyRecordings.length > 0) {
        const { error: recordingsError } = await supabase
          .from('artist_recordings')
          .insert(legacyRecordings);

        if (recordingsError) {
          logger.warn('Failed to create legacy artist recordings', {
            error: recordingsError.message,
            source: 'useArtistRegistrations',
          });
        }
      }
    }

    // Step 5: Create gallery and populate with images
    try {
      const { data: galleryId, error: galleryError } = await supabase.rpc('create_artist_gallery', {
        p_artist_id: newArtist.id,
        p_artist_name: reg.artist_name,
      });

      if (galleryError) {
        logger.warn('Failed to create artist gallery', {
          error: galleryError.message,
          source: 'useArtistRegistrations',
        });
      } else if (galleryId) {
        // Add profile image as cover if exists
        if (reg.profile_image_url) {
          await supabase
            .from('media_items')
            .insert({
              gallery_id: galleryId,
              file_path: reg.profile_image_url,
              media_type: 'image' as const,
              is_cover: true,
              display_order: 0,
              is_active: true,
            });
        }

        // Add press images to gallery
        const pressImages = reg.press_images as string[] | null;
        if (pressImages && pressImages.length > 0) {
          const pressImageItems = pressImages.map((url: string, index: number) => ({
            gallery_id: galleryId,
            file_path: url,
            media_type: 'image' as const,
            is_cover: false,
            display_order: index + 1,
            is_active: true,
          }));

          await supabase
            .from('media_items')
            .insert(pressImageItems);
        }
      }
    } catch (galleryErr) {
      logger.warn('Gallery creation failed', {
        error: galleryErr instanceof Error ? galleryErr.message : 'Unknown error',
        source: 'useArtistRegistrations',
      });
    }

    // Step 6: Assign artist role to the user
    if (reg.user_id) {
      try {
        await RoleManagementService.addRole(reg.user_id, ROLES.ARTIST);
        logger.info('Artist role assigned to user', {
          source: 'useArtistRegistrations',
          details: { userId: reg.user_id, artistId: newArtist.id },
        });
      } catch (roleError) {
        logger.warn('Failed to assign artist role to user', {
          error: roleError instanceof Error ? roleError.message : 'Unknown error',
          source: 'useArtistRegistrations',
        });
      }
    }

    toast.success(t('artistRegistrations.approveSuccess', { name: reg.artist_name }));
    invalidateQueries();
  };

  /**
   * Deny a registration
   */
  const handleDeny = async (registration: ArtistRegistration, reviewerNotes: string) => {
    const updatePayload = {
      status: 'denied' as const,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id || null,
      reviewer_notes: reviewerNotes || null,
    };

    logger.info('Attempting to deny registration', {
      source: 'useArtistRegistrations',
      details: {
        registrationId: registration.id,
        userId: user?.id,
        payload: updatePayload,
      },
    });

    const { error } = await supabase
      .from('artist_registrations')
      .update(updatePayload)
      .eq('id', registration.id)
      .select();

    if (error) {
      logger.error('Supabase returned error', {
        source: 'useArtistRegistrations',
        details: {
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code,
        },
      });
      throw error;
    }

    toast.success(t('artistRegistrations.denySuccess', { name: registration.artist_name }));
    invalidateQueries();
  };

  /**
   * Delete a registration permanently
   */
  const handleDelete = async (registration: ArtistRegistration) => {
    const { error } = await supabase
      .from('artist_registrations')
      .delete()
      .eq('id', registration.id);

    if (error) {
      logger.error('Failed to delete registration', {
        error: error.message,
        source: 'useArtistRegistrations',
        details: { registrationId: registration.id },
      });
      throw error;
    }

    toast.success(t('artistRegistrations.deleteSuccess', { name: registration.artist_name }));
    invalidateQueries();
  };

  return {
    handleApprove,
    handleDeny,
    handleDelete,
  };
}
