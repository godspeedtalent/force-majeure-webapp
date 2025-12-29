/**
 * Error Log Adapter Interface
 *
 * Defines the contract for error logging backends.
 * Implementations can use Supabase, Sentry, DataDog, custom APIs, etc.
 *
 * Usage:
 * ```typescript
 * // Create adapter for your backend
 * const adapter = new SupabaseErrorLogAdapter(supabase);
 *
 * // Or use a third-party service
 * const adapter = new SentryErrorLogAdapter(sentryClient);
 *
 * // Pass to the ErrorLoggingService
 * const loggingService = new ErrorLoggingService(adapter);
 * ```
 */

import type {
  ErrorLogEntry,
  StoredErrorLog,
  ErrorLogFilters,
  PaginatedErrorLogs,
  ErrorLogSummary,
} from '../types';

/**
 * Result type for adapter operations
 */
export interface AdapterResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Error Log Adapter Interface
 *
 * All error logging backends must implement this interface.
 * This allows swapping between Supabase, Sentry, DataDog, etc.
 */
export interface ErrorLogAdapter {
  /**
   * Adapter name for debugging
   */
  readonly name: string;

  /**
   * Write a single error log entry
   */
  write(entry: ErrorLogEntry): Promise<AdapterResult<string>>;

  /**
   * Write multiple error log entries (batch insert)
   */
  writeBatch(entries: ErrorLogEntry[]): Promise<AdapterResult<string[]>>;

  /**
   * Query error logs with filters and pagination
   */
  query(
    filters: ErrorLogFilters,
    page?: number,
    pageSize?: number
  ): Promise<AdapterResult<PaginatedErrorLogs>>;

  /**
   * Get a single error log by ID
   */
  getById(id: string): Promise<AdapterResult<StoredErrorLog | null>>;

  /**
   * Get error count summary by level
   */
  getSummary(
    dateFrom?: string,
    dateTo?: string
  ): Promise<AdapterResult<ErrorLogSummary[]>>;

  /**
   * Delete error logs older than specified date
   */
  deleteOlderThan(date: Date): Promise<AdapterResult<number>>;

  /**
   * Check if the adapter is healthy/connected
   */
  healthCheck(): Promise<AdapterResult<boolean>>;
}

/**
 * No-op adapter for when logging is disabled
 * Useful for testing or when you want to disable logging entirely
 */
export class NoOpErrorLogAdapter implements ErrorLogAdapter {
  readonly name = 'no-op';

  async write(_entry: ErrorLogEntry): Promise<AdapterResult<string>> {
    return { success: true, data: 'no-op' };
  }

  async writeBatch(entries: ErrorLogEntry[]): Promise<AdapterResult<string[]>> {
    return { success: true, data: entries.map(() => 'no-op') };
  }

  async query(
    _filters: ErrorLogFilters,
    page = 1,
    pageSize = 50
  ): Promise<AdapterResult<PaginatedErrorLogs>> {
    return {
      success: true,
      data: {
        data: [],
        page,
        pageSize,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }

  async getById(_id: string): Promise<AdapterResult<StoredErrorLog | null>> {
    return { success: true, data: null };
  }

  async getSummary(
    _dateFrom?: string,
    _dateTo?: string
  ): Promise<AdapterResult<ErrorLogSummary[]>> {
    return { success: true, data: [] };
  }

  async deleteOlderThan(_date: Date): Promise<AdapterResult<number>> {
    return { success: true, data: 0 };
  }

  async healthCheck(): Promise<AdapterResult<boolean>> {
    return { success: true, data: true };
  }
}

/**
 * Console-only adapter for development
 * Logs to console but doesn't persist anywhere
 */
export class ConsoleErrorLogAdapter implements ErrorLogAdapter {
  readonly name = 'console';

  private formatEntry(entry: ErrorLogEntry): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    return `${prefix} ${entry.message}`;
  }

  async write(entry: ErrorLogEntry): Promise<AdapterResult<string>> {
    const formatted = this.formatEntry(entry);
    const id = crypto.randomUUID();

    switch (entry.level) {
      case 'debug':
        console.debug(formatted, entry.details);
        break;
      case 'info':
        console.info(formatted, entry.details);
        break;
      case 'warn':
        console.warn(formatted, entry.details);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted, entry.details, entry.stackTrace);
        break;
    }

    return { success: true, data: id };
  }

  async writeBatch(entries: ErrorLogEntry[]): Promise<AdapterResult<string[]>> {
    const ids: string[] = [];
    for (const entry of entries) {
      const result = await this.write(entry);
      if (result.data) {
        ids.push(result.data);
      }
    }
    return { success: true, data: ids };
  }

  async query(
    _filters: ErrorLogFilters,
    page = 1,
    pageSize = 50
  ): Promise<AdapterResult<PaginatedErrorLogs>> {
    console.warn('[ConsoleErrorLogAdapter] query() not supported - logs are not persisted');
    return {
      success: true,
      data: {
        data: [],
        page,
        pageSize,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }

  async getById(_id: string): Promise<AdapterResult<StoredErrorLog | null>> {
    console.warn('[ConsoleErrorLogAdapter] getById() not supported - logs are not persisted');
    return { success: true, data: null };
  }

  async getSummary(): Promise<AdapterResult<ErrorLogSummary[]>> {
    console.warn('[ConsoleErrorLogAdapter] getSummary() not supported - logs are not persisted');
    return { success: true, data: [] };
  }

  async deleteOlderThan(_date: Date): Promise<AdapterResult<number>> {
    return { success: true, data: 0 };
  }

  async healthCheck(): Promise<AdapterResult<boolean>> {
    return { success: true, data: true };
  }
}
