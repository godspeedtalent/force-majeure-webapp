/**
 * Async utilities for handling timeouts and race conditions
 */

import { logger } from '@/shared/services/logger';
import { diagWarn } from '@/shared/services/initDiagnostics';

const asyncLogger = logger.createNamespace('AsyncUtils');

/** Default timeout for database queries (10 seconds) */
export const DEFAULT_QUERY_TIMEOUT_MS = 10000;

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the specified time, throws a QueryTimeoutError.
 *
 * @param promise - The promise to wrap (accepts PromiseLike for Supabase compatibility)
 * @param operationName - Name for logging/diagnostics
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns The resolved value or throws on timeout
 */
export async function withQueryTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  operationName: string,
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      const error = new QueryTimeoutError(
        `${operationName} timed out after ${timeoutMs}ms`,
        operationName,
        timeoutMs
      );
      asyncLogger.warn(`Query timeout: ${operationName}`, { timeoutMs });
      diagWarn(`query.timeout.${operationName}`, `Timed out after ${timeoutMs}ms`);
      reject(error);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Custom error class for query timeouts
 */
export class QueryTimeoutError extends Error {
  public readonly operationName: string;
  public readonly timeoutMs: number;
  public readonly isTimeout = true;

  constructor(message: string, operationName: string, timeoutMs: number) {
    super(message);
    this.name = 'QueryTimeoutError';
    this.operationName = operationName;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Type guard to check if an error is a QueryTimeoutError
 */
export function isQueryTimeoutError(error: unknown): error is QueryTimeoutError {
  return error instanceof QueryTimeoutError ||
    (error !== null &&
     typeof error === 'object' &&
     'isTimeout' in error &&
     (error as QueryTimeoutError).isTimeout === true);
}
