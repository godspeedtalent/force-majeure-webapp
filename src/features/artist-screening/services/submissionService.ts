/**
 * Submission Service
 *
 * Handles submission-related operations including:
 * - Hard delete (admin/developer only, no paper trail)
 * - User ignore/unignore (per-user hide feature)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import { handleError } from '@/shared/services/errorHandler';

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Hard delete a submission (admin/developer only)
 * Completely removes submission from database with no paper trail.
 * All related records (tags, reviews, scores) cascade delete automatically.
 *
 * @param submissionId - ID of the submission to delete
 * @throws Error if deletion fails or user lacks permission
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('screening_submissions')
      .delete()
      .eq('id', submissionId);

    if (error) {
      logger.error('Failed to delete submission', {
        error: error.message,
        context: 'submissionService.deleteSubmission',
        details: { submissionId },
      });
      throw error;
    }

    logger.info('Submission deleted successfully', {
      context: 'submissionService.deleteSubmission',
      details: { submissionId },
    });
  } catch (error) {
    handleError(error, {
      title: 'Failed to delete submission',
      context: 'submissionService.deleteSubmission',
    });
    throw error;
  }
}

// ============================================================================
// Ignore/Unignore Operations (Per-User)
// ============================================================================

/**
 * Ignore a submission for the current user
 * Hides the submission from the user's feed (per-user, reversible)
 *
 * @param submissionId - ID of the submission to ignore
 * @throws Error if operation fails
 */
export async function ignoreSubmission(submissionId: string): Promise<void> {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_ignored_submissions')
      .insert({
        submission_id: submissionId,
        user_id: user.id,
      });

    if (error) {
      // If duplicate (already ignored), treat as success
      if (error.code === '23505') {
        logger.info('Submission already ignored', {
          context: 'submissionService.ignoreSubmission',
          details: { submissionId },
        });
        return;
      }

      logger.error('Failed to ignore submission', {
        error: error.message,
        context: 'submissionService.ignoreSubmission',
        details: { submissionId },
      });
      throw error;
    }

    logger.info('Submission ignored successfully', {
      context: 'submissionService.ignoreSubmission',
      details: { submissionId },
    });
  } catch (error) {
    handleError(error, {
      title: 'Failed to hide submission',
      context: 'submissionService.ignoreSubmission',
    });
    throw error;
  }
}

/**
 * Unignore a submission for the current user
 * Restores the submission to the user's feed
 *
 * @param submissionId - ID of the submission to unignore
 * @throws Error if operation fails
 */
export async function unignoreSubmission(submissionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_ignored_submissions')
      .delete()
      .eq('submission_id', submissionId);
    // RLS policy ensures user can only delete their own ignores

    if (error) {
      logger.error('Failed to unignore submission', {
        error: error.message,
        context: 'submissionService.unignoreSubmission',
        details: { submissionId },
      });
      throw error;
    }

    logger.info('Submission restored successfully', {
      context: 'submissionService.unignoreSubmission',
      details: { submissionId },
    });
  } catch (error) {
    handleError(error, {
      title: 'Failed to restore submission',
      context: 'submissionService.unignoreSubmission',
    });
    throw error;
  }
}

/**
 * Get list of submission IDs ignored by current user
 *
 * @returns Array of ignored submission IDs
 */
export async function getIgnoredSubmissionIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_ignored_submissions')
      .select('submission_id');

    if (error) {
      logger.error('Failed to fetch ignored submissions', {
        error: error.message,
        context: 'submissionService.getIgnoredSubmissionIds',
      });
      throw error;
    }

    return (data || []).map(row => row.submission_id);
  } catch (error) {
    handleError(error, {
      title: 'Failed to fetch ignored submissions',
      context: 'submissionService.getIgnoredSubmissionIds',
    });
    return [];
  }
}

/**
 * Check if current user has ignored a specific submission
 *
 * @param submissionId - ID of the submission to check
 * @returns True if ignored, false otherwise
 */
export async function isSubmissionIgnored(submissionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_ignored_submissions')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle();

    if (error) throw error;

    return data !== null;
  } catch (error) {
    logger.error('Failed to check if submission is ignored', {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'submissionService.isSubmissionIgnored',
      details: { submissionId },
    });
    return false;
  }
}
