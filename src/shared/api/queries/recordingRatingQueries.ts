import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import type {
  RecordingRating,
  RecordingRatingWithUser,
  RecordingWithRatings,
  RecordingRatingStats,
  RecordingAnalyticsFilters,
  CreateRatingInput,
  RatingDashboardStats,
} from '@/shared/types/recordingRatings';

/**
 * Recording Rating Queries
 *
 * Centralized React Query hooks for the internal DJ recording rating system.
 * Access restricted to developers and admins only.
 *
 * Usage:
 * ```ts
 * const { data: ratings } = useRecordingRatings(recordingId);
 * const { data: myRating } = useUserRatingForRecording(recordingId, userId);
 * const upsertMutation = useUpsertRating();
 * ```
 */

// ============================================================================
// Query Keys
// ============================================================================

export const recordingRatingKeys = {
  all: ['recording-ratings'] as const,
  byRecording: (recordingId: string) =>
    [...recordingRatingKeys.all, 'recording', recordingId] as const,
  byUser: (userId: string) =>
    [...recordingRatingKeys.all, 'user', userId] as const,
  userRatingForRecording: (recordingId: string, userId: string) =>
    [...recordingRatingKeys.all, 'user-rating', recordingId, userId] as const,
  analytics: (filters?: RecordingAnalyticsFilters) =>
    [...recordingRatingKeys.all, 'analytics', filters] as const,
  stats: (recordingId: string) =>
    [...recordingRatingKeys.all, 'stats', recordingId] as const,
  dashboardStats: () =>
    [...recordingRatingKeys.all, 'dashboard-stats'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all ratings for a specific recording
 */
export function useRecordingRatings(recordingId: string | undefined) {
  return useQuery<RecordingRatingWithUser[], Error>({
    queryKey: recordingRatingKeys.byRecording(recordingId || ''),
    queryFn: async () => {
      if (!recordingId) return [];

      const { data, error } = await (supabase as any)
        .from('recording_ratings')
        .select(
          `
          *,
          profiles!user_id(id, display_name, avatar_url)
        `
        )
        .eq('recording_id', recordingId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching recording ratings', {
          error: error.message,
          source: 'recordingRatingQueries',
          details: { recordingId },
        });
        throw error;
      }

      return data as RecordingRatingWithUser[];
    },
    enabled: !!recordingId,
  });
}

/**
 * Fetch the current user's rating for a recording (if exists)
 */
export function useUserRatingForRecording(
  recordingId: string | undefined,
  userId: string | undefined
) {
  return useQuery<RecordingRating | null, Error>({
    queryKey: recordingRatingKeys.userRatingForRecording(
      recordingId || '',
      userId || ''
    ),
    queryFn: async () => {
      if (!userId || !recordingId) return null;

      const { data, error } = await (supabase as any)
        .from('recording_ratings')
        .select('*')
        .eq('recording_id', recordingId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user rating', {
          error: error.message,
          source: 'recordingRatingQueries',
          details: { recordingId, userId },
        });
        throw error;
      }

      return data;
    },
    enabled: !!recordingId && !!userId,
  });
}

/**
 * Fetch rating statistics for a recording
 */
export function useRecordingRatingStats(recordingId: string | undefined) {
  return useQuery<RecordingRatingStats | null, Error>({
    queryKey: recordingRatingKeys.stats(recordingId || ''),
    queryFn: async () => {
      if (!recordingId) return null;

      const { data, error } = await (supabase as any)
        .from('recording_ratings')
        .select('score')
        .eq('recording_id', recordingId);

      if (error) {
        logger.error('Error fetching rating stats', {
          error: error.message,
          source: 'recordingRatingQueries',
          details: { recordingId },
        });
        throw error;
      }

      if (!data || data.length === 0) return null;

      const scores = data.map((r: { score: number }) => r.score);
      return {
        recording_id: recordingId,
        average_score: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
        rating_count: scores.length,
        min_score: Math.min(...scores),
        max_score: Math.max(...scores),
      };
    },
    enabled: !!recordingId,
  });
}

/**
 * Fetch recordings with ratings for analytics dashboard
 */
export function useRecordingsWithRatings(filters?: RecordingAnalyticsFilters) {
  return useQuery<RecordingWithRatings[], Error>({
    queryKey: recordingRatingKeys.analytics(filters),
    queryFn: async () => {
      let query = (supabase as any)
        .from('artist_recordings')
        .select(
          `
          *,
          artists!artist_id(id, name, image_url),
          recording_ratings(
            *,
            profiles!user_id(id, display_name, avatar_url)
          )
        `
        )
        .order('created_at', { ascending: false });

      // Apply platform filter
      if (filters?.platform && filters.platform !== 'all') {
        query = query.eq('platform', filters.platform);
      }

      // Apply recording type filter
      if (filters?.recordingType && filters.recordingType !== 'all') {
        query = query.eq('recording_type', filters.recordingType);
      }

      // Apply date filters
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching recordings with ratings', {
          error: error.message,
          source: 'recordingRatingQueries',
          details: { filters },
        });
        throw error;
      }

      // Client-side filtering for computed values
      let results = (data || []) as RecordingWithRatings[];

      // Filter by rating count
      if (filters?.minRatingCount !== undefined) {
        results = results.filter(
          r => r.recording_ratings.length >= (filters.minRatingCount || 0)
        );
      }

      // Filter by score range
      if (filters?.minScore !== undefined || filters?.maxScore !== undefined) {
        results = results.filter(r => {
          if (r.recording_ratings.length === 0) return false;
          const avg =
            r.recording_ratings.reduce((sum, rt) => sum + rt.score, 0) /
            r.recording_ratings.length;
          if (filters.minScore !== undefined && avg < filters.minScore)
            return false;
          if (filters.maxScore !== undefined && avg > filters.maxScore)
            return false;
          return true;
        });
      }

      // Sort
      if (filters?.sortBy) {
        results.sort((a, b) => {
          let comparison = 0;
          switch (filters.sortBy) {
            case 'average_score': {
              const avgA =
                a.recording_ratings.length > 0
                  ? a.recording_ratings.reduce((s, r) => s + r.score, 0) /
                    a.recording_ratings.length
                  : 0;
              const avgB =
                b.recording_ratings.length > 0
                  ? b.recording_ratings.reduce((s, r) => s + r.score, 0) /
                    b.recording_ratings.length
                  : 0;
              comparison = avgA - avgB;
              break;
            }
            case 'rating_count':
              comparison =
                a.recording_ratings.length - b.recording_ratings.length;
              break;
            case 'created_at':
              comparison =
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime();
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
          }
          return filters.sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      return results;
    },
  });
}

/**
 * Fetch dashboard summary statistics
 */
export function useRatingDashboardStats() {
  return useQuery<RatingDashboardStats, Error>({
    queryKey: recordingRatingKeys.dashboardStats(),
    queryFn: async () => {
      // Fetch all recordings with ratings
      const { data: recordings, error: recordingsError } = await (
        supabase as any
      )
        .from('artist_recordings')
        .select(
          `
          id,
          name,
          artists!artist_id(name),
          recording_ratings(
            score,
            user_id
          )
        `
        );

      if (recordingsError) {
        logger.error('Error fetching dashboard stats', {
          error: recordingsError.message,
          source: 'recordingRatingQueries',
          details: {},
        });
        throw recordingsError;
      }

      // Fetch all ratings for reviewer stats
      const { data: allRatings, error: ratingsError } = await (supabase as any)
        .from('recording_ratings')
        .select(
          `
          user_id,
          profiles!user_id(display_name)
        `
        );

      if (ratingsError) {
        logger.error('Error fetching rating stats', {
          error: ratingsError.message,
          source: 'recordingRatingQueries',
          details: {},
        });
        throw ratingsError;
      }

      // Calculate stats
      const ratedRecordings = recordings.filter(
        (r: any) => r.recording_ratings.length > 0
      );
      const totalRatings = recordings.reduce(
        (sum: number, r: any) => sum + r.recording_ratings.length,
        0
      );

      // Calculate overall average
      let totalScore = 0;
      let scoreCount = 0;
      recordings.forEach((r: any) => {
        r.recording_ratings.forEach((rating: any) => {
          totalScore += rating.score;
          scoreCount++;
        });
      });

      // Find top rated recording
      let topRatedRecording = null;
      let highestAvg = 0;
      ratedRecordings.forEach((r: any) => {
        const avg =
          r.recording_ratings.reduce(
            (sum: number, rt: any) => sum + rt.score,
            0
          ) / r.recording_ratings.length;
        if (avg > highestAvg) {
          highestAvg = avg;
          topRatedRecording = {
            id: r.id,
            name: r.name,
            artist_name: r.artists?.name || 'Unknown',
            average_score: avg,
          };
        }
      });

      // Find most active reviewer
      const reviewerCounts: Record<
        string,
        { display_name: string; count: number }
      > = {};
      allRatings?.forEach((rating: any) => {
        const userId = rating.user_id;
        if (!reviewerCounts[userId]) {
          reviewerCounts[userId] = {
            display_name: rating.profiles?.display_name || 'Unknown User',
            count: 0,
          };
        }
        reviewerCounts[userId].count++;
      });

      let mostActiveReviewer = null;
      let maxCount = 0;
      Object.entries(reviewerCounts).forEach(([userId, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count;
          mostActiveReviewer = {
            user_id: userId,
            display_name: data.display_name,
            rating_count: data.count,
          };
        }
      });

      return {
        totalRatedRecordings: ratedRecordings.length,
        totalRatings,
        averageOverallScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        topRatedRecording,
        mostActiveReviewer,
      };
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create or update a rating (upsert)
 */
export function useUpsertRating() {
  const queryClient = useQueryClient();

  return useMutation<RecordingRating, Error, CreateRatingInput>({
    mutationFn: async (input) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('recording_ratings')
        .upsert(
          {
            recording_id: input.recording_id,
            user_id: user.id,
            score: input.score,
            notes: input.notes || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'recording_id,user_id',
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Error upserting rating', {
          error: error.message,
          source: 'recordingRatingQueries',
          details: { input },
        });
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.byRecording(data.recording_id),
      });
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.stats(data.recording_id),
      });
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.analytics(),
      });
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.dashboardStats(),
      });
    },
  });
}

/**
 * Delete a rating
 */
export function useDeleteRating() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { ratingId: string; recordingId: string }>({
    mutationFn: async ({ ratingId }) => {
      const { error } = await (supabase as any)
        .from('recording_ratings')
        .delete()
        .eq('id', ratingId);

      if (error) {
        logger.error('Error deleting rating', {
          error: error.message,
          source: 'recordingRatingQueries',
          details: { ratingId },
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.byRecording(variables.recordingId),
      });
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.stats(variables.recordingId),
      });
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.analytics(),
      });
      queryClient.invalidateQueries({
        queryKey: recordingRatingKeys.dashboardStats(),
      });
    },
  });
}
