/**
 * Shared QueryClient instance for React Query.
 *
 * This is exported separately so it can be accessed from:
 * - App.tsx (for the QueryClientProvider)
 * - AuthContext.tsx (for clearing cache on sign out)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Smart retry logic (skips auth/permission errors)
 * - Configurable cache settings
 * - Network reconnection handling
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

/**
 * Check if an error is a network error that should be retried
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }

  if (error && typeof error === 'object') {
    // Check for common network error patterns
    if ('message' in error) {
      const message = String((error as { message: string }).message).toLowerCase();
      if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('fetch')
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if an error is a server error that should be retried (5xx)
 */
function isServerError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // Check status code
    if ('status' in error) {
      const status = Number((error as { status: number }).status);
      return status >= 500 && status < 600;
    }

    // Check code (Supabase pattern)
    if ('code' in error) {
      const code = String((error as { code: string }).code);
      // PostgreSQL/Supabase server errors
      if (code.startsWith('5')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if an error is rate limited (429) and should be retried
 */
function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('status' in error && (error as { status: number }).status === 429) {
      return true;
    }
    if ('code' in error && (error as { code: string }).code === '429') {
      return true;
    }
  }
  return false;
}

/**
 * Check if an error is an auth/permission error that should NOT be retried
 */
function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('code' in error) {
      const code = String((error as { code: string }).code);
      // Auth errors: 401, 403, PostgreSQL permission denied (42501)
      return code === '401' || code === '403' || code === '42501';
    }
    if ('status' in error) {
      const status = Number((error as { status: number }).status);
      return status === 401 || status === 403;
    }
  }
  return false;
}

/**
 * Determine if an error should be retried
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry auth/permission errors
  if (isAuthError(error)) {
    return false;
  }

  // Always retry network errors (up to limit)
  if (isNetworkError(error)) {
    return failureCount < 3;
  }

  // Retry server errors (up to limit)
  if (isServerError(error)) {
    return failureCount < 3;
  }

  // Retry rate limit errors (with longer delay handled by retryDelay)
  if (isRateLimitError(error)) {
    return failureCount < 3;
  }

  // Default: retry other errors up to 2 times
  return failureCount < 2;
}

/**
 * Calculate retry delay with exponential backoff
 * @param attemptIndex - Zero-based attempt index (0 = first retry)
 * @param error - The error that triggered the retry
 * @returns Delay in milliseconds before next retry
 */
function calculateRetryDelay(attemptIndex: number, error: unknown): number {
  // For rate limit errors, use longer delays
  if (isRateLimitError(error)) {
    return Math.min(5000 * Math.pow(2, attemptIndex), 60000); // 5s, 10s, 20s... max 60s
  }

  // For other errors, use standard exponential backoff
  // 1s, 2s, 4s, 8s... max 30s
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache settings
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection cache

      // Refetch behavior
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
      refetchOnReconnect: 'always', // Do refetch when network reconnects

      // Retry configuration with smart error detection
      retry: shouldRetry,
      retryDelay: calculateRetryDelay,
    },
    mutations: {
      // Mutations get 1 retry for network/server errors only
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (isAuthError(error)) {
          return false;
        }
        // Only retry network/server errors, max 1 time
        if (isNetworkError(error) || isServerError(error)) {
          return failureCount < 1;
        }
        return false;
      },
      retryDelay: 1000, // 1 second delay for mutation retries
    },
  },
});

// Export utility functions for use in custom hooks
export { isNetworkError, isServerError, isRateLimitError, isAuthError };
