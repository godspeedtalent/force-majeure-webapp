import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';
import { extractSpotifyTrackId, getSpotifyTrack } from '@/services/spotify/spotifyApiService';
import { getSoundCloudTrackFromUrl } from '@/services/soundcloud/soundcloudApiService';

// ============================================================================
// Types
// ============================================================================

export interface ArtistRecord {
  id: string;
  name: string;
  genre: string | null;
  image_url: string | null;
  bio: string | null;
  website: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  soundcloud_id: string | null;
  spotify_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  artist_genres?: Array<{ genre_id: string; is_primary: boolean | null }>;
  genre_names?: string[];
}

export interface VenueRecord {
  id: string;
  name: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  capacity: number | null;
  image_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordingRecord {
  id: string;
  artist_id: string;
  name: string;
  duration: number | null;
  url: string | null;
  cover_art: string | null;
  platform: string | null;
  is_primary_dj_set: boolean;
  created_at: string;
  updated_at: string;
  artist_name?: string | null;
}

// ============================================================================
// Count Queries Hook
// ============================================================================

export function useDatabaseCounts() {
  const { data: pendingRegistrationsCount = 0 } = useQuery({
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

  const { data: totalRegistrationsCount = 0 } = useQuery({
    queryKey: ['artist-registrations-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artist_registrations')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: pendingUserRequestsCount = 0 } = useQuery({
    queryKey: ['user-requests-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: totalUserRequestsCount = 0 } = useQuery({
    queryKey: ['user-requests-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: venuesCount = 0 } = useQuery({
    queryKey: ['venues-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: organizationsCount = 0 } = useQuery({
    queryKey: ['organizations-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: artistsCount = 0 } = useQuery({
    queryKey: ['artists-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: eventsCount = 0 } = useQuery({
    queryKey: ['events-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: recordingsCount = 0 } = useQuery({
    queryKey: ['recordings-count'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from('artist_recordings')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  return {
    pendingRegistrationsCount,
    totalRegistrationsCount,
    pendingUserRequestsCount,
    totalUserRequestsCount,
    venuesCount,
    organizationsCount,
    usersCount,
    artistsCount,
    eventsCount,
    recordingsCount,
  };
}

// ============================================================================
// Artists Data Hook
// ============================================================================

export function useArtistsData() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Fetch all genres first for the map
  const { data: allGenres = [] } = useQuery({
    queryKey: ['all-genres'],
    queryFn: async () => {
      const { data, error } = await supabase.from('genres').select('id, name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['admin-artists', allGenres],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          genre,
          image_url,
          bio,
          website,
          instagram_handle,
          tiktok_handle,
          soundcloud_id,
          spotify_id,
          created_at,
          updated_at,
          artist_genres(genre_id, is_primary)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to include genre_names array for column display
      return (data ?? []).map(artist => ({
        ...artist,
        genre_names: artist.artist_genres?.map((ag: { genre_id: string; is_primary: boolean | null }) => {
          const genreData = allGenres.find(g => g.id === ag.genre_id);
          return genreData?.name || ag.genre_id;
        }) || [],
      }));
    },
    enabled: allGenres.length > 0 || true,
  });

  const handleUpdate = async (
    row: ArtistRecord,
    columnKey: string,
    newValue: unknown
  ) => {
    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, unknown> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      const { error } = await supabase
        .from('artists')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(
        ['admin-artists', allGenres],
        (oldData: ArtistRecord[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(artist =>
            artist.id === row.id
              ? {
                  ...artist,
                  ...updateData,
                  updated_at: new Date().toISOString(),
                }
              : artist
          );
        }
      );

      toast.success(t('devTools.database.artistUpdated'));
    } catch (error) {
      logger.error('Error updating artist:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error(t('devTools.database.artistUpdateFailed'));
      throw error;
    }
  };

  const handleCreate = async (newRow: Partial<ArtistRecord>) => {
    const name = typeof newRow.name === 'string' ? newRow.name.trim() : '';
    if (!name) {
      throw new Error('Artist name is required');
    }

    const payload = {
      name,
      genre:
        typeof newRow.genre === 'string' && newRow.genre.trim() !== ''
          ? newRow.genre.trim()
          : null,
      image_url:
        typeof newRow.image_url === 'string' && newRow.image_url.trim() !== ''
          ? newRow.image_url.trim()
          : null,
      bio:
        typeof newRow.bio === 'string' && newRow.bio.trim() !== ''
          ? newRow.bio.trim()
          : null,
      instagram_handle:
        typeof newRow.instagram_handle === 'string' && newRow.instagram_handle.trim() !== ''
          ? newRow.instagram_handle.trim()
          : null,
      tiktok_handle:
        typeof newRow.tiktok_handle === 'string' && newRow.tiktok_handle.trim() !== ''
          ? newRow.tiktok_handle.trim()
          : null,
      soundcloud_id:
        typeof newRow.soundcloud_id === 'string' && newRow.soundcloud_id.trim() !== ''
          ? newRow.soundcloud_id.trim()
          : null,
      spotify_id:
        typeof newRow.spotify_id === 'string' && newRow.spotify_id.trim() !== ''
          ? newRow.spotify_id.trim()
          : null,
    };

    try {
      const { error } = await supabase.from('artists').insert(payload);
      if (error) throw error;

      toast.success(t('devTools.database.artistCreated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
    } catch (error) {
      logger.error('Error creating artist:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error(t('devTools.database.artistCreateFailed'));
      throw error;
    }
  };

  const handleDelete = async (artist: ArtistRecord) => {
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artist.id);

      if (error) throw error;

      toast.success(t('devTools.database.artistDeleted'));
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
    } catch (error) {
      logger.error('Error deleting artist:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error(t('devTools.database.artistDeleteFailed'));
      throw error;
    }
  };

  return {
    artists,
    isLoading,
    handleUpdate,
    handleCreate,
    handleDelete,
  };
}

// ============================================================================
// Venues Data Hook
// ============================================================================

export function useVenuesData() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('venues')
        .select(
          `
          id, name, address_line_1, address_line_2, city, state, zip_code,
          capacity, image_url, website, created_at, updated_at,
          cities!city_id(name, state)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the city data for easier access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((venue: any) => ({
        ...venue,
        city: venue.cities
          ? `${venue.cities.name}, ${venue.cities.state}`
          : null,
      }));
    },
  });

  const handleUpdate = async (
    row: VenueRecord,
    columnKey: string,
    newValue: unknown
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Convert capacity to integer if updating that field
    if (columnKey === 'capacity') {
      const numValue = parseInt(String(newValue), 10);
      if (isNaN(numValue)) {
        throw new Error('Capacity must be a valid number');
      }
      updateData[columnKey] = numValue;
    } else {
      updateData[columnKey] = newValue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('venues')
      .update(updateData)
      .eq('id', row.id);

    if (error) throw error;

    // Update local data instead of refetching to maintain sort order
    queryClient.setQueryData(['admin-venues'], (oldData: VenueRecord[]) => {
      if (!oldData) return oldData;
      return oldData.map(venue =>
        venue.id === row.id
          ? { ...venue, ...updateData, updated_at: new Date().toISOString() }
          : venue
      );
    });
  };

  const handleDelete = async (venue: VenueRecord) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('venues')
        .delete()
        .eq('id', venue.id);

      if (error) throw error;

      toast.success(t('devTools.database.venueDeleted'));
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
    } catch (error) {
      logger.error('Error deleting venue:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error(t('devTools.database.venueDeleteFailed'));
      throw error;
    }
  };

  return {
    venues,
    isLoading,
    handleUpdate,
    handleDelete,
  };
}

// ============================================================================
// Recordings Data Hook
// ============================================================================

export function useRecordingsData() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['admin-recordings'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('artist_recordings')
        .select(`
          id, artist_id, name, duration, url, cover_art, platform, is_primary_dj_set, created_at, updated_at,
          artists!artist_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten artist name for easier access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((recording: any) => ({
        ...recording,
        artist_name: recording.artists?.name || null,
      }));
    },
  });

  const handleUpdate = async (
    row: RecordingRecord,
    columnKey: string,
    newValue: unknown
  ) => {
    let normalizedValue: unknown =
      typeof newValue === 'string' ? newValue.trim() : newValue;

    // Convert string 'true'/'false' to boolean for is_primary_dj_set
    if (columnKey === 'is_primary_dj_set') {
      normalizedValue = normalizedValue === 'true' || normalizedValue === true;
    }

    const updateData: Record<string, unknown> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artist_recordings')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(
        ['admin-recordings'],
        (oldData: RecordingRecord[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(recording =>
            recording.id === row.id
              ? {
                  ...recording,
                  ...updateData,
                  updated_at: new Date().toISOString(),
                }
              : recording
          );
        }
      );

      toast.success(t('devTools.database.recordingUpdated'));
    } catch (error) {
      logger.error('Error updating recording:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error(t('devTools.database.recordingUpdateFailed'));
      throw error;
    }
  };

  const handleDelete = async (recording: RecordingRecord) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artist_recordings')
        .delete()
        .eq('id', recording.id);

      if (error) throw error;

      toast.success(t('devTools.database.recordingDeleted'));
      queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
    } catch (error) {
      logger.error('Error deleting recording:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error(t('devTools.database.recordingDeleteFailed'));
      throw error;
    }
  };

  const handleRefreshDetails = async (recording: RecordingRecord) => {
    const url = recording.url;
    if (!url) {
      toast.error('No URL found for this recording');
      return;
    }

    const loadingToast = toast.loading('Fetching recording details...');

    try {
      let updateData: Record<string, unknown> = {};

      if (url.includes('spotify.com')) {
        const trackId = extractSpotifyTrackId(url);
        if (!trackId) {
          toast.dismiss(loadingToast);
          toast.error('Could not extract Spotify track ID from URL');
          return;
        }

        const track = await getSpotifyTrack(trackId);
        updateData = {
          name: track.name,
          cover_art: track.album.images[0]?.url || null,
          platform: 'spotify',
        };
      } else if (url.includes('soundcloud.com')) {
        const trackData = await getSoundCloudTrackFromUrl(url);
        if (!trackData) {
          toast.dismiss(loadingToast);
          toast.error('Could not fetch SoundCloud track details');
          return;
        }

        updateData = {
          name: trackData.name,
          cover_art: trackData.coverArt || null,
          platform: 'soundcloud',
        };
      } else {
        toast.dismiss(loadingToast);
        toast.error('Unknown platform. Only Spotify and SoundCloud URLs are supported.');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artist_recordings')
        .update(updateData)
        .eq('id', recording.id);

      if (error) throw error;

      queryClient.setQueryData(['admin-recordings'], (oldData: RecordingRecord[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(rec =>
          rec.id === recording.id
            ? { ...rec, ...updateData, updated_at: new Date().toISOString() }
            : rec
        );
      });

      toast.dismiss(loadingToast);
      toast.success(`Updated "${updateData.name}" successfully`);
    } catch (error) {
      toast.dismiss(loadingToast);
      logger.error('Error refreshing recording details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useDeveloperDatabaseData',
      });
      toast.error('Failed to refresh recording details');
    }
  };

  return {
    recordings,
    isLoading,
    handleUpdate,
    handleDelete,
    handleRefreshDetails,
  };
}
