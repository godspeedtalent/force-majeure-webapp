/**
 * Shared QueryClient instance for React Query.
 *
 * This is exported separately so it can be accessed from:
 * - App.tsx (for the QueryClientProvider)
 * - AuthContext.tsx (for clearing cache on sign out)
 *
 * @example
 * ```typescript
 * import { queryClient } from '@/lib/queryClient';
 *
 * // Clear all queries on sign out
 * queryClient.clear();
 * ```
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global cache settings - prevents aggressive refetching
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in garbage collection cache
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
      refetchOnReconnect: 'always', // Do refetch when network reconnects

      // Disable automatic retries for 403/401 errors
      retry: (failureCount, error) => {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error.code === '403' || error.code === '401' || error.code === '42501')
        ) {
          return false; // Don't retry permission errors
        }
        return failureCount < 3;
      },
    },
  },
});
