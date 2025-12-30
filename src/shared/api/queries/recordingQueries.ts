import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import type { Database } from '@/integrations/supabase/types';

type ArtistRecordingRow = Database['public']['Tables']['artist_recordings']['Row'];
type ArtistRecordingInsert = Database['public']['Tables']['artist_recordings']['Insert'];
type ArtistRecordingUpdate = Database['public']['Tables']['artist_recordings']['Update'];

/**
 * Recording Queries
 *
 * Centralized React Query hooks for artist recording operations.
 * Manages CRUD operations for the artist_recordings table.
 */

// ============================================================================
// Types
// ============================================================================

export interface ArtistRecording extends ArtistRecordingRow {
  click_count?: number; // May be added via RPC
}

export interface CreateRecordingData {
  artist_id: string;
  name: string;
  url: string;
  platform: string;
  cover_art?: string | null;
  duration?: string | null;
  is_primary_dj_set?: boolean;
}

export interface UpdateRecordingData {
  name?: string;
  url?: string;
  platform?: string;
  cover_art?: string | null;
  duration?: string | null;
  is_primary_dj_set?: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const recordingKeys = {
  all: ['recordings'] as const,
  lists: () => [...recordingKeys.all, 'list'] as const,
  byArtist: (artistId: string) => [...recordingKeys.all, 'artist', artistId] as const,
  detail: (id: string) => [...recordingKeys.all, 'detail', id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all recordings for an artist
 */
export function useArtistRecordings(artistId: string | undefined) {
  return useQuery<ArtistRecording[], Error>({
    queryKey: recordingKeys.byArtist(artistId || ''),
    queryFn: async () => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('artist_recordings')
        .select('*')
        .eq('artist_id', artistId)
        .order('is_primary_dj_set', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching artist recordings', {
          error: error.message,
          source: 'recordingQueries',
          artistId,
        });
        throw error;
      }

      return (data || []) as ArtistRecording[];
    },
    enabled: !!artistId,
  });
}

/**
 * Fetch a single recording by ID
 */
export function useRecordingById(recordingId: string | undefined) {
  return useQuery<ArtistRecording | null, Error>({
    queryKey: recordingKeys.detail(recordingId || ''),
    queryFn: async () => {
      if (!recordingId) return null;

      const { data, error } = await supabase
        .from('artist_recordings')
        .select('*')
        .eq('id', recordingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error fetching recording by ID', {
          error: error.message,
          source: 'recordingQueries',
          recordingId,
        });
        throw error;
      }

      return data as ArtistRecording;
    },
    enabled: !!recordingId,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new recording
 */
export function useCreateRecording() {
  const queryClient = useQueryClient();

  return useMutation<ArtistRecording, Error, CreateRecordingData>({
    mutationFn: async (recordingData) => {
      const insertData: ArtistRecordingInsert = {
        artist_id: recordingData.artist_id,
        name: recordingData.name,
        url: recordingData.url,
        platform: recordingData.platform,
        cover_art: recordingData.cover_art || null,
        duration: recordingData.duration || null,
        is_primary_dj_set: recordingData.is_primary_dj_set ?? false,
      };

      const { data, error } = await supabase
        .from('artist_recordings')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating recording', {
          error: error.message,
          source: 'recordingQueries',
        });
        throw error;
      }

      return data as ArtistRecording;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.byArtist(data.artist_id) });
      queryClient.invalidateQueries({ queryKey: ['artist', data.artist_id] });
    },
  });
}

/**
 * Update a recording
 */
export function useUpdateRecording() {
  const queryClient = useQueryClient();

  return useMutation<ArtistRecording, Error, { recordingId: string; artistId: string; data: UpdateRecordingData }>({
    mutationFn: async ({ recordingId, data }) => {
      const updateData: ArtistRecordingUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('artist_recordings')
        .update(updateData)
        .eq('id', recordingId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating recording', {
          error: error.message,
          source: 'recordingQueries',
          recordingId,
        });
        throw error;
      }

      return result as ArtistRecording;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.detail(variables.recordingId) });
      queryClient.invalidateQueries({ queryKey: recordingKeys.byArtist(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: ['artist', variables.artistId] });
    },
  });
}

/**
 * Delete a recording
 */
export function useDeleteRecording() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { recordingId: string; artistId: string }>({
    mutationFn: async ({ recordingId }) => {
      const { error } = await supabase
        .from('artist_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) {
        logger.error('Error deleting recording', {
          error: error.message,
          source: 'recordingQueries',
          recordingId,
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: recordingKeys.detail(variables.recordingId) });
      queryClient.invalidateQueries({ queryKey: recordingKeys.byArtist(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: ['artist', variables.artistId] });
    },
  });
}

/**
 * Set a recording as primary DJ set (and unset others)
 */
export function useSetPrimaryRecording() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { recordingId: string; artistId: string }>({
    mutationFn: async ({ recordingId, artistId }) => {
      // First, unset all primary flags for this artist
      const { error: unsetError } = await supabase
        .from('artist_recordings')
        .update({ is_primary_dj_set: false, updated_at: new Date().toISOString() })
        .eq('artist_id', artistId);

      if (unsetError) {
        logger.error('Error unsetting primary recordings', {
          error: unsetError.message,
          source: 'recordingQueries',
          artistId,
        });
        throw unsetError;
      }

      // Then, set the selected recording as primary
      const { error: setError } = await supabase
        .from('artist_recordings')
        .update({ is_primary_dj_set: true, updated_at: new Date().toISOString() })
        .eq('id', recordingId);

      if (setError) {
        logger.error('Error setting primary recording', {
          error: setError.message,
          source: 'recordingQueries',
          recordingId,
        });
        throw setError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recordingKeys.byArtist(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: ['artist', variables.artistId] });
    },
  });
}
