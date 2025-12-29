/**
 * Error Logging Feature
 *
 * Provides persistent error logging with swappable backends.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { errorLoggingService } from '@/features/error-logging';
 *
 * // Log an error
 * await errorLoggingService.error('Something went wrong', {
 *   endpoint: '/api/users',
 *   details: { userId: '123' },
 * });
 *
 * // Log an API error with context
 * await errorLoggingService.logApiError('Request failed', {
 *   endpoint: '/rest/v1/events',
 *   method: 'POST',
 *   statusCode: 500,
 *   error: caughtError,
 * });
 * ```
 *
 * ## Swapping Backends
 *
 * ```typescript
 * import {
 *   errorLoggingService,
 *   SupabaseErrorLogAdapter,
 *   ConsoleErrorLogAdapter,
 * } from '@/features/error-logging';
 *
 * // Switch to console-only logging
 * errorLoggingService.setAdapter(new ConsoleErrorLogAdapter());
 *
 * // Or create a custom adapter
 * class SentryAdapter implements ErrorLogAdapter {
 *   // ... implement interface
 * }
 * errorLoggingService.setAdapter(new SentryAdapter(sentryClient));
 * ```
 */

// Types
export type {
  ErrorLogLevel,
  ErrorLogSource,
  ErrorLogEntry,
  StoredErrorLog,
  ErrorLogFilters,
  PaginatedErrorLogs,
  ErrorLogSummary,
  ErrorLoggingConfig,
} from './types';

export {
  DEFAULT_ERROR_LOGGING_CONFIG,
  LOG_LEVEL_PRIORITY,
  ERROR_LEVEL_CONFIG,
  ERROR_SOURCE_CONFIG,
} from './types';

// Adapters
export type { ErrorLogAdapter, AdapterResult } from './adapters';
export {
  NoOpErrorLogAdapter,
  ConsoleErrorLogAdapter,
  SupabaseErrorLogAdapter,
} from './adapters';

// Services
export {
  ErrorLoggingService,
  createErrorLoggingService,
} from './services';
export type {
  ErrorLoggingAdapterType,
  CreateErrorLoggingServiceOptions,
} from './services';

// ============================================================
// Default singleton instance
// ============================================================

import { supabase } from '@/shared';
import { SupabaseErrorLogAdapter } from './adapters';
import { ErrorLoggingService } from './services';

/**
 * Default error logging service instance
 *
 * Uses Supabase adapter in production, console adapter in development.
 * You can swap the adapter at runtime using setAdapter().
 */
export const errorLoggingService = new ErrorLoggingService(
  new SupabaseErrorLogAdapter(supabase),
  {
    // In development, also log to console
    consoleLogging: import.meta.env.DEV,
    // In development, log everything; in production, only warn and above
    minLevel: import.meta.env.DEV ? 'debug' : 'warn',
  }
);
