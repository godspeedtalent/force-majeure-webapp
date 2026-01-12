/**
 * Contact Submissions React Query Hooks
 *
 * Provides hooks for fetching and managing contact submissions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  getContactSubmissions,
  getContactSubmissionById,
  updateSubmissionStatus,
  updateSubmissionNotes,
  deleteContactSubmission,
  getUnreadCount,
} from '../services/contactSubmissionService';
import {
  ContactSubmission,
  ContactSubmissionFilters,
  ContactSubmissionStatus,
} from '../types';

// ============================================================================
// Query Keys
// ============================================================================

export const contactSubmissionKeys = {
  all: ['contact-submissions'] as const,
  lists: () => [...contactSubmissionKeys.all, 'list'] as const,
  list: (filters: ContactSubmissionFilters) =>
    [...contactSubmissionKeys.lists(), filters] as const,
  details: () => [...contactSubmissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactSubmissionKeys.details(), id] as const,
  unreadCount: () => [...contactSubmissionKeys.all, 'unread-count'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch contact submissions with filters
 */
export function useContactSubmissions(
  filters: ContactSubmissionFilters = {},
  options?: { enabled?: boolean }
) {
  return useQuery<ContactSubmission[], Error>({
    queryKey: contactSubmissionKeys.list(filters),
    queryFn: () => getContactSubmissions(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single contact submission by ID
 */
export function useContactSubmissionById(
  id: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<ContactSubmission | null, Error>({
    queryKey: contactSubmissionKeys.detail(id || ''),
    queryFn: () => {
      if (!id) throw new Error('Submission ID is required');
      return getContactSubmissionById(id);
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

/**
 * Get unread submissions count
 */
export function useUnreadCount() {
  return useQuery<number, Error>({
    queryKey: contactSubmissionKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update submission status
 */
export function useUpdateSubmissionStatus() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  return useMutation<
    ContactSubmission,
    Error,
    { id: string; status: ContactSubmissionStatus }
  >({
    mutationFn: ({ id, status }) => updateSubmissionStatus(id, status),
    onSuccess: (_data, { status }) => {
      toast.success(t('contactSubmissions.statusUpdated', { status }));
      queryClient.invalidateQueries({ queryKey: contactSubmissionKeys.all });
    },
    onError: error => {
      toast.error(t('contactSubmissions.updateFailed', { error: error.message }));
    },
  });
}

/**
 * Update submission notes
 */
export function useUpdateSubmissionNotes() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  return useMutation<ContactSubmission, Error, { id: string; notes: string }>({
    mutationFn: ({ id, notes }) => updateSubmissionNotes(id, notes),
    onSuccess: () => {
      toast.success(t('contactSubmissions.notesSaved'));
      queryClient.invalidateQueries({ queryKey: contactSubmissionKeys.all });
    },
    onError: error => {
      toast.error(t('contactSubmissions.updateFailed', { error: error.message }));
    },
  });
}

/**
 * Delete a submission
 */
export function useDeleteContactSubmission() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: id => deleteContactSubmission(id),
    onSuccess: () => {
      toast.success(t('contactSubmissions.deleted'));
      queryClient.invalidateQueries({ queryKey: contactSubmissionKeys.all });
    },
    onError: error => {
      toast.error(t('contactSubmissions.deleteFailed', { error: error.message }));
    },
  });
}

// ============================================================================
// Utility Hook for Refreshing
// ============================================================================

/**
 * Hook to refresh contact submissions data
 */
export function useRefreshContactSubmissions() {
  const queryClient = useQueryClient();

  return {
    refreshAll: () =>
      queryClient.invalidateQueries({ queryKey: contactSubmissionKeys.all }),
    refreshList: () =>
      queryClient.invalidateQueries({ queryKey: contactSubmissionKeys.lists() }),
  };
}
