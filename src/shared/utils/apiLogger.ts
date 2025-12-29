/**
 * API Logger Utilities
 *
 * Convenience functions for logging API errors.
 * These are thin wrappers around the error logging service.
 *
 * @deprecated Prefer using errorLoggingService directly from @/features/error-logging
 */

import { errorLoggingService } from '@/features/error-logging';
import type { ErrorLogLevel, ErrorLogSource } from '@/features/error-logging';

export interface ApiLogPayload {
  level?: 'error' | 'warn' | 'info';
  source?: string; // 'client' | 'edge_function' | ...
  endpoint?: string;
  method?: string;
  status?: number;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  request_id?: string;
}

/**
 * Log an API error
 *
 * @deprecated Use errorLoggingService.logApiError() instead
 */
export async function logApiError(payload: ApiLogPayload) {
  try {
    await errorLoggingService.log({
      level: (payload.level ?? 'error') as ErrorLogLevel,
      source: (payload.source ?? 'client') as ErrorLogSource,
      message: payload.message ?? 'API Error',
      endpoint: payload.endpoint,
      method: payload.method,
      statusCode: payload.status,
      requestId: payload.request_id,
      details: payload.details,
    });
  } catch (_) {
    // best-effort logging; ignore failures
  }
}

/**
 * Generic server-side log for info/warn events
 *
 * @deprecated Use errorLoggingService.log() instead
 */
export async function logApi(payload: ApiLogPayload) {
  try {
    await errorLoggingService.log({
      level: (payload.level ?? 'info') as ErrorLogLevel,
      source: (payload.source ?? 'client') as ErrorLogSource,
      message: payload.message ?? 'API Log',
      endpoint: payload.endpoint,
      method: payload.method,
      statusCode: payload.status,
      requestId: payload.request_id,
      details: payload.details,
    });
  } catch (_) {
    // best-effort logging; ignore failures
  }
}
