import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase, logger } from '@/shared';
import { toast } from 'sonner';
import type {
  CreateSubmissionInput,
  CreateReviewInput,
  UpdateReviewInput,
  MakeDecisionInput,
  UpdateConfigInput,
} from '../types';
import { screeningQueryKeys } from './useScreeningSubmissions';

/**
 * Artist Screening - Mutation Hooks
 *
 * React Query mutations for creating submissions, reviews, and decisions.
 *
 * Usage:
 * ```ts
 * const createSubmission = useCreateSubmission();
 * const createReview = useCreateReview();
 * const makeDecision = useMakeDecision();
 * ```
 */

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new submission (artist submitting DJ set for review)
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubmissionInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('screening_submissions')
        .insert({
          artist_id: input.artist_id,
          recording_id: input.recording_id,
          context_type: input.context_type,
          event_id: input.event_id || null,
          venue_id: input.venue_id || null,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Submission sent successfully', {
        description: "We'll notify you within 7 days of our decision.",
      });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.stats() });
    },
    onError: async (error: Error) => {
      const { message, details } = await extractSupabaseError(
        error,
        'Failed to submit'
      );
      logger.error('Error creating submission', {
        error: message,
        source: 'useCreateSubmission',
        details,
      });
      toast.error('Failed to submit', { description: message });
    },
  });
}

/**
 * Submit a review for a submission (staff reviewing DJ set)
 * Uses edge function for server-side validation and score calculation
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'createReview',
          submission_id: input.submission_id,
          rating: input.rating,
          metric_scores: input.metric_scores,
          internal_notes: input.internal_notes,
          listen_duration_seconds: input.listen_duration_seconds,
        },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Review submitted successfully');
      queryClient.invalidateQueries({
        queryKey: screeningQueryKeys.submission(variables.submission_id),
      });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.reviewerStats() });
    },
    onError: async (error: Error) => {
      const { message, details } = await extractSupabaseError(
        error,
        'Failed to submit review'
      );
      logger.error('Error creating review', {
        error: message,
        source: 'useCreateReview',
        details,
      });
      toast.error('Failed to submit review', { description: message });
    },
  });
}

/**
 * Update an existing review (staff editing their own review)
 * Uses edge function for server-side validation and score recalculation
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReviewInput) => {
      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'updateReview',
          review_id: input.review_id,
          rating: input.rating,
          metric_scores: input.metric_scores,
          internal_notes: input.internal_notes,
          listen_duration_seconds: input.listen_duration_seconds,
        },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: (data) => {
      toast.success('Review updated successfully');
      // Invalidate the submission query to refresh the review list
      queryClient.invalidateQueries({
        queryKey: screeningQueryKeys.submission(data.submission_id),
      });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.reviewerStats() });
    },
    onError: async (error: Error) => {
      const { message, details } = await extractSupabaseError(
        error,
        'Failed to update review'
      );
      logger.error('Error updating review', {
        error: message,
        source: 'useUpdateReview',
        details,
      });
      toast.error('Failed to update review', { description: message });
    },
  });
}

/**
 * Delete a review (staff deleting their own review)
 * Uses edge function for server-side validation and score recalculation
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { review_id: string; submission_id: string }) => {
      const { error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'deleteReview',
          review_id: input.review_id,
        },
      });

      if (error) throw error;
      return { submissionId: input.submission_id };
    },
    onSuccess: (data) => {
      toast.success('Review deleted successfully');
      // Invalidate the submission query to refresh the review list
      queryClient.invalidateQueries({
        queryKey: screeningQueryKeys.submission(data.submissionId),
      });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.reviewerStats() });
    },
    onError: async (error: Error) => {
      const { message, details } = await extractSupabaseError(
        error,
        'Failed to delete review'
      );
      logger.error('Error deleting review', {
        error: message,
        source: 'useDeleteReview',
        details,
      });
      toast.error('Failed to delete review', { description: message });
    },
  });
}

/**
 * Make final decision (approve/reject) on submission
 * Uses edge function for server-side validation and email notification
 */
export function useMakeDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MakeDecisionInput) => {
      const { error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'makeDecision',
          submission_id: input.submission_id,
          status: input.decision,
          decision_notes: input.decision_note,
        },
      });

      if (error) throw error;
      return { submissionId: input.submission_id, decision: input.decision };
    },
    onSuccess: (data) => {
      const message =
        data.decision === 'approved'
          ? 'Submission approved - Artist will be notified'
          : 'Submission rejected - Artist will be notified';
      toast.success(message);

      queryClient.invalidateQueries({
        queryKey: screeningQueryKeys.submission(data.submissionId),
      });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.rankings('all-time') });
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.rankings('hot') });
    },
    onError: async (error: Error) => {
      const { message, details } = await extractSupabaseError(
        error,
        'Failed to make decision'
      );
      logger.error('Error making decision', {
        error: message,
        source: 'useMakeDecision',
        details,
      });
      toast.error('Failed to make decision', { description: message });
    },
  });
}

/**
 * Update screening configuration (admin only)
 * Uses edge function for server-side validation and permission checks
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateConfigInput) => {
      const { data, error } = await supabase.functions.invoke('screening', {
        body: {
          operation: 'updateConfig',
          id: 1, // Default config ID (singleton table)
          min_reviews_for_approval: input.min_reviews_for_approval,
          min_listen_time_seconds: input.min_listen_time_seconds,
          min_approval_score: input.min_approval_score,
          hot_score_half_life_days: input.hot_score_half_life_days,
        },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      toast.success('Configuration updated');
      queryClient.invalidateQueries({ queryKey: screeningQueryKeys.all });
    },
    onError: async (error: Error) => {
      const { message, details } = await extractSupabaseError(
        error,
        'Failed to update configuration'
      );
      logger.error('Error updating config', {
        error: message,
        source: 'useUpdateConfig',
        details,
      });
      toast.error('Failed to update configuration', { description: message });
    },
  });
}

// ============================================================================
// Error Parsing Helpers
// ============================================================================

interface EdgeFunctionErrorResponse {
  success?: boolean;
  error?: string;
  message?: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
}

async function extractSupabaseError(
  error: unknown,
  fallbackMessage: string
): Promise<{ message: string; details: Record<string, unknown> }> {
  const details: Record<string, unknown> = {
    errorType: error instanceof Error ? error.name : typeof error,
  };

  if (error instanceof Error) {
    details.originalMessage = error.message;
    details.stack = error.stack;
  }

  if (error instanceof FunctionsHttpError) {
    details.status = error.context?.status;
    try {
      const body: EdgeFunctionErrorResponse = await error.context.json();
      details.response = body;
      const message = body?.error || body?.message || fallbackMessage;
      return { message, details };
    } catch (parseError) {
      details.parseError = parseError instanceof Error ? parseError.message : parseError;
      return { message: error.message || fallbackMessage, details };
    }
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.code) details.code = err.code;
    if (err.hint) details.hint = err.hint;
    if (err.details) details.details = err.details;
    if (err.status) details.status = err.status;
    if (err.statusText) details.statusText = err.statusText;

    const message =
      (typeof err.message === 'string' && err.message) ||
      (typeof err.error === 'string' && err.error) ||
      fallbackMessage;
    return { message, details };
  }

  if (typeof error === 'string') {
    return { message: error, details };
  }

  return { message: fallbackMessage, details };
}
