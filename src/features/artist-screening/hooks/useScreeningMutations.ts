import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import { toast } from 'sonner';
import type {
  CreateSubmissionInput,
  CreateReviewInput,
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
    onError: (error: Error) => {
      logger.error('Error creating submission', {
        error: error.message,
        source: 'useCreateSubmission',
      });
      toast.error('Failed to submit', { description: error.message });
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
    onError: (error: Error) => {
      logger.error('Error creating review', {
        error: error.message,
        source: 'useCreateReview',
      });
      toast.error('Failed to submit review', { description: error.message });
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
    onError: (error: Error) => {
      logger.error('Error making decision', {
        error: error.message,
        source: 'useMakeDecision',
      });
      toast.error('Failed to make decision', { description: error.message });
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
    onError: (error: Error) => {
      logger.error('Error updating config', {
        error: error.message,
        source: 'useUpdateConfig',
      });
      toast.error('Failed to update configuration', { description: error.message });
    },
  });
}
