/**
 * Centralized Error Handling Service
 *
 * Provides a consistent way to handle errors throughout the application.
 * For developers/admins, shows detailed error information with copyable content.
 * For regular users, shows user-friendly error messages.
 *
 * Usage:
 * ```ts
 * import { handleError } from '@/shared/services/errorHandler';
 *
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleError(error, {
 *     title: 'Failed to Save',
 *     context: 'Saving user profile'
 *   });
 * }
 * ```
 */

import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { logApiError } from '@/shared/utils/apiLogger';

interface ErrorHandlerOptions {
  /** Title to display in the error toast */
  title: string;

  /** User-friendly description of what failed */
  description?: string;

  /** Context about what was being done when the error occurred */
  context?: string;

  /** The endpoint or API being called (for logging) */
  endpoint?: string;

  /** HTTP method used (for logging) */
  method?: string;

  /** Whether to show the toast (default: true) */
  showToast?: boolean;

  /** Whether to log the error to backend (default: true) */
  logError?: boolean;

  /** User role (if not provided, will be auto-detected) */
  userRole?: string;
}

/**
 * Check if user is a developer or admin
 */
function isDeveloperOrAdmin(userRole?: string): boolean {
  if (userRole) {
    return userRole === 'developer' || userRole === 'admin';
  }

  // Try to get from localStorage if not provided
  try {
    const storedRole = localStorage.getItem('userRole');
    return storedRole === 'developer' || storedRole === 'admin';
  } catch {
    return false;
  }
}

/**
 * Extract error details from various error types
 */
function extractErrorDetails(error: unknown): {
  message: string;
  details?: any;
  status?: number;
  stack?: string;
} {
  // Standard Error object
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  // Supabase error format
  if (error && typeof error === 'object') {
    const err = error as any;

    // PostgrestError format
    if (err.message && err.details) {
      return {
        message: err.message,
        details: err.details,
        status: err.code,
      };
    }

    // HTTP Response error
    if (err.status && err.statusText) {
      return {
        message: err.statusText || 'Request failed',
        status: err.status,
        details: err.body || err.data,
      };
    }

    // Generic error object
    if (err.error || err.message) {
      return {
        message: err.error || err.message || 'Unknown error',
        details: err.details,
        status: err.status,
      };
    }
  }

  // String error
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    details: error,
  };
}

/**
 * Build response body for developer display
 */
function buildResponseBody(
  errorDetails: ReturnType<typeof extractErrorDetails>
): string {
  const parts: string[] = [];

  if (errorDetails.message) {
    parts.push(`Message: ${errorDetails.message}`);
  }

  if (errorDetails.status) {
    parts.push(`Status: ${errorDetails.status}`);
  }

  if (errorDetails.details) {
    parts.push(`Details: ${JSON.stringify(errorDetails.details, null, 2)}`);
  }

  if (errorDetails.stack) {
    parts.push(`\nStack Trace:\n${errorDetails.stack}`);
  }

  return parts.join('\n');
}

/**
 * Main error handler function
 *
 * @param error - The error that occurred
 * @param options - Configuration options
 */
export async function handleError(
  error: unknown,
  options: ErrorHandlerOptions
): Promise<void> {
  const {
    title,
    description,
    context,
    endpoint,
    method,
    showToast = true,
    logError = true,
    userRole,
  } = options;

  const isDev = isDeveloperOrAdmin(userRole);
  const errorDetails = extractErrorDetails(error);

  // Log to console for debugging
  logger.error(`[ErrorHandler] ${title}:`, error);
  if (context) {
    logger.error(`[ErrorHandler] Context: ${context}`);
  }

  // Log to backend if enabled
  if (logError) {
    try {
      await logApiError({
        level: 'error',
        source: 'client',
        endpoint: endpoint || context || 'unknown',
        method: method || 'UNKNOWN',
        status: errorDetails.status,
        message: `${title}: ${errorDetails.message}`,
        details: {
          description,
          context,
          errorDetails: errorDetails.details,
          stack: errorDetails.stack,
        },
      });
    } catch (logErr) {
      // Silently fail if logging fails
      logger.error('[ErrorHandler] Failed to log error:', logErr);
    }
  }

  // Show toast notification if enabled
  if (showToast) {
    const errorObject = new Error(errorDetails.message);
    if (errorDetails.stack) {
      errorObject.stack = errorDetails.stack;
    }

    // Build enhanced description for developers
    let devDescription = description || errorDetails.message;
    if (isDev && errorDetails.details) {
      const responseBody = buildResponseBody(errorDetails);
      devDescription = `${description || errorDetails.message}\n\nResponse:\n${responseBody}`;
    }

    showErrorToast({
      title,
      description: devDescription,
      error: errorObject,
      isDeveloper: isDev,
    });
  }
}

/**
 * Async wrapper that catches and handles errors
 *
 * Usage:
 * ```ts
 * const result = await withErrorHandler(
 *   async () => await supabase.from('events').select(),
 *   { title: 'Failed to load events' }
 * );
 * ```
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    await handleError(error, options);
    return null;
  }
}

/**
 * Sync wrapper that catches and handles errors
 */
export function withErrorHandlerSync<T>(
  fn: () => T,
  options: ErrorHandlerOptions
): T | null {
  try {
    return fn();
  } catch (error) {
    handleError(error, options);
    return null;
  }
}
