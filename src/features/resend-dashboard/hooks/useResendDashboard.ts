/**
 * Resend Dashboard React Query Hooks
 *
 * Provides hooks for fetching and managing Resend email data.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getResendEmails,
  getResendEmailById,
  getResendDomains,
  calculateEmailStats,
} from '../services/resendDashboardService';
import type {
  ResendEmail,
  ResendDashboardStats,
  ResendEmailListResponse,
  ResendDomainListResponse,
} from '../types';

// ============================================================================
// Query Keys
// ============================================================================

export const resendKeys = {
  all: ['resend'] as const,
  emails: () => [...resendKeys.all, 'emails'] as const,
  emailList: () => [...resendKeys.emails(), 'list'] as const,
  emailDetail: (id: string) => [...resendKeys.emails(), 'detail', id] as const,
  domains: () => [...resendKeys.all, 'domains'] as const,
  stats: () => [...resendKeys.all, 'stats'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch list of sent emails from Resend
 */
export function useResendEmails(
  limit: number = 50,
  options?: { enabled?: boolean }
) {
  return useQuery<ResendEmailListResponse, Error>({
    queryKey: resendKeys.emailList(),
    queryFn: () => getResendEmails(limit),
    enabled: options?.enabled ?? true,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single email by ID
 */
export function useResendEmailById(
  id: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<ResendEmail, Error>({
    queryKey: resendKeys.emailDetail(id || ''),
    queryFn: () => {
      if (!id) throw new Error('Email ID is required');
      return getResendEmailById(id);
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

/**
 * Fetch list of configured domains from Resend
 */
export function useResendDomains(options?: { enabled?: boolean }) {
  return useQuery<ResendDomainListResponse, Error>({
    queryKey: resendKeys.domains(),
    queryFn: () => getResendDomains(),
    enabled: options?.enabled ?? true,
    staleTime: 300000, // 5 minutes (domains rarely change)
  });
}

/**
 * Get computed email statistics from email list
 */
export function useResendStats(options?: { enabled?: boolean }) {
  const emailsQuery = useResendEmails(100, options);

  return useQuery<ResendDashboardStats, Error>({
    queryKey: resendKeys.stats(),
    queryFn: () => {
      if (!emailsQuery.data?.data) {
        return {
          totalEmails: 0,
          sent: 0,
          delivered: 0,
          bounced: 0,
          opened: 0,
          clicked: 0,
          complained: 0,
          deliveryDelayed: 0,
        };
      }
      return calculateEmailStats(emailsQuery.data.data);
    },
    enabled: (options?.enabled ?? true) && emailsQuery.isSuccess,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Utility Hook for Refreshing
// ============================================================================

/**
 * Hook to refresh Resend dashboard data
 */
export function useRefreshResendData() {
  const queryClient = useQueryClient();

  return {
    refreshAll: () =>
      queryClient.invalidateQueries({ queryKey: resendKeys.all }),
    refreshEmails: () =>
      queryClient.invalidateQueries({ queryKey: resendKeys.emails() }),
    refreshDomains: () =>
      queryClient.invalidateQueries({ queryKey: resendKeys.domains() }),
    refreshStats: () =>
      queryClient.invalidateQueries({ queryKey: resendKeys.stats() }),
  };
}
