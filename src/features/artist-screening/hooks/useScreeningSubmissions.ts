import { useQuery } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase, logger } from '@/shared';
import type {
  ScreeningSubmissionWithDetails,
  SubmissionFilters,
  SubmissionStats,
} from '../types';

/**
 * Artist Screening - Submission Queries
 *
 * React Query hooks for fetching screening submissions with filtering, sorting,
 * and aggregated statistics.
 *
 * Usage:
 * ```ts
 * const { data: submissions } = useScreeningSubmissions({ context: 'venue', status: 'pending' });
 * const { data: submission } = useSubmission(submissionId);
 * const { data: stats } = useSubmissionStats();
 * ```
 */

// ============================================================================
// Error Handling Helpers
// ============================================================================

interface EdgeFunctionErrorResponse {
  success: false;
  error: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Extract detailed error message from Edge Function response
 * Supabase's FunctionsHttpError contains the response body in context.body
 */
async function extractEdgeFunctionError(
  error: Error,
  fallbackMessage: string
): Promise<{ message: string; details: Record<string, unknown> }> {
  const details: Record<string, unknown> = {
    originalError: error.message,
    errorName: error.name,
  };

  // Handle FunctionsHttpError - contains response body
  if (error instanceof FunctionsHttpError) {
    try {
      // The error context contains the response
      const errorBody: EdgeFunctionErrorResponse = await error.context.json();
      details.serverError = errorBody.error;
      details.requestId = errorBody.requestId;
      details.validationErrors = errorBody.errors;

      const message = errorBody.error || fallbackMessage;
      return { message, details };
    } catch {
      // JSON parsing failed
      details.parseError = 'Failed to parse error response';
    }
  }

  return { message: error.message || fallbackMessage, details };
}

// ============================================================================
// Query Keys
// ============================================================================

export const screeningQueryKeys = {
  all: ['artist-screening'] as const,
  submissions: (filters?: SubmissionFilters) =>
    [...screeningQueryKeys.all, 'submissions', filters] as const,
  submission: (id: string) =>
    [...screeningQueryKeys.all, 'submission', id] as const,
  stats: () =>
    [...screeningQueryKeys.all, 'stats'] as const,
  config: () =>
    [...screeningQueryKeys.all, 'config'] as const,
  rankings: (type: 'all-time' | 'hot') =>
    [...screeningQueryKeys.all, 'rankings', type] as const,
  reviewerStats: () =>
    [...screeningQueryKeys.all, 'reviewer-stats'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all submissions with filtering and sorting
 * Uses edge function for server-side processing
 */
export function useScreeningSubmissions(filters?: SubmissionFilters) {
  return useQuery<ScreeningSubmissionWithDetails[], Error>({
    queryKey: screeningQueryKeys.submissions(filters),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'getSubmissions',
          context: filters?.context !== 'all' ? filters?.context : undefined,
          status: filters?.status !== 'all' ? filters?.status : undefined,
          startDate: filters?.dateFrom?.toISOString(),
          endDate: filters?.dateTo?.toISOString(),
          genreMismatch: filters?.genreMismatch,
          minReviews: filters?.minReviews,
        },
      });

      if (error) {
        const { message, details } = await extractEdgeFunctionError(
          error,
          'Error fetching screening submissions'
        );
        logger.error('Error fetching screening submissions', {
          error: message,
          source: 'useScreeningSubmissions',
          details: { ...details, filters },
        });
        throw new Error(message);
      }

      // Edge function returns standardized response
      let results = data.data || [];

      // Client-side sorting (if needed)
      if (filters?.sortBy) {
        results.sort((a: ScreeningSubmissionWithDetails, b: ScreeningSubmissionWithDetails) => {
          let comparison = 0;
          switch (filters.sortBy) {
            case 'created_at':
              comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              break;
            case 'indexed_score': {
              const scoreA = a.submission_scores?.indexed_score ?? 0;
              const scoreB = b.submission_scores?.indexed_score ?? 0;
              comparison = scoreA - scoreB;
              break;
            }
            case 'hot_indexed_score': {
              const scoreA = a.submission_scores?.hot_indexed_score ?? 0;
              const scoreB = b.submission_scores?.hot_indexed_score ?? 0;
              comparison = scoreA - scoreB;
              break;
            }
            case 'review_count':
              comparison = (a.submission_scores?.review_count || 0) - (b.submission_scores?.review_count || 0);
              break;
          }
          return filters.sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      return results as ScreeningSubmissionWithDetails[];
    },
  });
}

/**
 * Fetch single submission with full details
 * Uses edge function for consistent server-side processing
 */
export function useSubmission(submissionId: string | undefined) {
  return useQuery<ScreeningSubmissionWithDetails | null, Error>({
    queryKey: screeningQueryKeys.submission(submissionId || ''),
    queryFn: async () => {
      if (!submissionId) return null;

      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'getSubmission',
          id: submissionId,
        },
      });

      if (error) {
        const { message, details } = await extractEdgeFunctionError(
          error,
          'Error fetching submission'
        );
        logger.error('Error fetching submission', {
          error: message,
          source: 'useSubmission',
          details: { ...details, submissionId },
        });
        throw new Error(message);
      }

      return data.data as ScreeningSubmissionWithDetails;
    },
    enabled: !!submissionId,
  });
}

/**
 * Fetch aggregate statistics for dashboard cards
 * Uses edge function with database-side aggregation (much faster!)
 */
export function useSubmissionStats() {
  return useQuery<SubmissionStats, Error>({
    queryKey: screeningQueryKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'getStats',
        },
      });

      if (error) {
        const { message, details } = await extractEdgeFunctionError(
          error,
          'Error fetching submission stats'
        );
        logger.error('Error fetching submission stats', {
          error: message,
          source: 'useSubmissionStats',
          details,
        });
        throw new Error(message);
      }

      // Map database response to expected format
      const stats = data.data;
      return {
        totalPending: stats.pending_count || 0,
        totalApproved: stats.approved_count || 0,
        totalRejected: stats.rejected_count || 0,
        avgReviewTime: stats.avg_review_time_hours || 0,
        approvalRate: stats.approval_rate || 0,
      };
    },
  });
}

/**
 * Fetch screening system configuration
 */
export function useScreeningConfig() {
  return useQuery({
    queryKey: screeningQueryKeys.config(),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('screening_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        logger.error('Error fetching screening config', {
          error: error.message,
          source: 'useScreeningConfig',
        });
        throw error;
      }

      return data;
    },
  });
}

/**
 * Fetch submission rankings (all-time or HOT with time decay)
 * Uses edge function for database-side sorting
 */
export function useSubmissionRankings(type: 'all-time' | 'hot') {
  return useQuery({
    queryKey: screeningQueryKeys.rankings(type),
    queryFn: async () => {
      // Map type to context_type
      const context_type = type === 'all-time' ? 'standalone' : 'venue';

      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'getRankings',
          context_type,
          limit: 50,
        },
      });

      if (error) {
        const { message, details } = await extractEdgeFunctionError(
          error,
          'Error fetching submission rankings'
        );
        logger.error('Error fetching submission rankings', {
          error: message,
          source: 'useSubmissionRankings',
          details: { ...details, type },
        });
        throw new Error(message);
      }

      return data.data || [];
    },
  });
}

/**
 * Fetch reviewer statistics and leaderboard
 * Uses edge function for database-side aggregation
 */
export function useReviewerStats() {
  return useQuery({
    queryKey: screeningQueryKeys.reviewerStats(),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'getReviewerStats',
        },
      });

      if (error) {
        const { message, details } = await extractEdgeFunctionError(
          error,
          'Error fetching reviewer stats'
        );
        logger.error('Error fetching reviewer stats', {
          error: message,
          source: 'useReviewerStats',
          details,
        });
        throw new Error(message);
      }

      return data.data || [];
    },
  });
}
