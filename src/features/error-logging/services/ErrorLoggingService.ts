/**
 * Error Logging Service
 *
 * High-level service for logging errors throughout the application.
 * Uses the adapter pattern to support swappable backends.
 *
 * Features:
 * - Configurable logging levels
 * - Automatic context enrichment (user agent, page URL, etc.)
 * - Retry logic for failed writes
 * - Optional batching for high-volume logging
 * - Field redaction for security
 * - Console fallback for development
 *
 * Usage:
 * ```typescript
 * import { errorLoggingService } from '@/features/error-logging';
 *
 * // Log an error
 * await errorLoggingService.error('Failed to load events', {
 *   endpoint: '/rest/v1/events',
 *   details: { eventId: '123' },
 * });
 *
 * // Log with full context
 * await errorLoggingService.log({
 *   level: 'error',
 *   source: 'client',
 *   message: 'Checkout failed',
 *   errorCode: 'STRIPE_PAYMENT_FAILED',
 *   endpoint: '/functions/v1/checkout',
 *   details: { cartId: 'abc' },
 * });
 * ```
 */

import type {
  ErrorLogEntry,
  ErrorLogFilters,
  ErrorLoggingConfig,
  ErrorLogLevel,
  PaginatedErrorLogs,
  StoredErrorLog,
} from '../types';
import {
  DEFAULT_ERROR_LOGGING_CONFIG,
  LOG_LEVEL_PRIORITY,
} from '../types';
import type { ErrorLogAdapter, AdapterResult } from '../adapters/ErrorLogAdapter';
import { ConsoleErrorLogAdapter } from '../adapters/ErrorLogAdapter';
import { logger } from '@/shared/services/logger';

/**
 * Partial entry for convenience methods
 */
type PartialErrorLogEntry = Omit<ErrorLogEntry, 'level' | 'source' | 'message'>;

/**
 * Session ID storage key
 */
const SESSION_ID_KEY = 'fm_error_session_id';

/**
 * Get or create a session ID for grouping errors
 */
function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // sessionStorage not available
    return crypto.randomUUID();
  }
}

/**
 * Redact sensitive fields from an object
 */
function redactSensitiveFields(
  obj: Record<string, unknown>,
  fieldsToRedact: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldRedact = fieldsToRedact.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (shouldRedact) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactSensitiveFields(
        value as Record<string, unknown>,
        fieldsToRedact
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract stack trace from an error
 */
function extractStackTrace(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    return String((error as { stack: unknown }).stack);
  }
  return undefined;
}

export class ErrorLoggingService {
  private adapter: ErrorLogAdapter;
  private config: ErrorLoggingConfig;
  private batchQueue: ErrorLogEntry[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private consoleAdapter: ConsoleErrorLogAdapter;

  constructor(
    adapter: ErrorLogAdapter,
    config: Partial<ErrorLoggingConfig> = {}
  ) {
    this.adapter = adapter;
    this.config = { ...DEFAULT_ERROR_LOGGING_CONFIG, ...config };
    this.consoleAdapter = new ConsoleErrorLogAdapter();
  }

  /**
   * Change the adapter at runtime
   */
  setAdapter(adapter: ErrorLogAdapter): void {
    this.adapter = adapter;
    logger.info(`[ErrorLoggingService] Adapter changed to: ${adapter.name}`);
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<ErrorLoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a level should be logged based on config
   */
  private shouldLog(level: ErrorLogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Enrich entry with automatic context
   */
  private enrichEntry(entry: ErrorLogEntry): ErrorLogEntry {
    const enriched: ErrorLogEntry = {
      ...entry,
      sessionId: entry.sessionId || getSessionId(),
      userAgent: entry.userAgent || navigator.userAgent,
      pageUrl: entry.pageUrl || window.location.href,
      environment: entry.environment || (import.meta.env.DEV ? 'development' : 'production'),
      appVersion: entry.appVersion || import.meta.env.VITE_APP_VERSION,
    };

    // Redact sensitive fields from details and metadata
    if (enriched.details) {
      enriched.details = redactSensitiveFields(
        enriched.details,
        this.config.redactFields
      );
    }
    if (enriched.metadata) {
      enriched.metadata = redactSensitiveFields(
        enriched.metadata,
        this.config.redactFields
      );
    }

    return enriched;
  }

  /**
   * Write entry with retry logic
   */
  private async writeWithRetry(
    entry: ErrorLogEntry,
    retries = 0
  ): Promise<AdapterResult<string>> {
    const result = await this.adapter.write(entry);

    if (!result.success && retries < this.config.maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, retries) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.writeWithRetry(entry, retries + 1);
    }

    return result;
  }

  /**
   * Flush the batch queue
   */
  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const entries = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const result = await this.adapter.writeBatch(entries);
    if (!result.success) {
      logger.warn('[ErrorLoggingService] Batch write failed', {
        error: result.error,
        entryCount: entries.length,
      });
    }
  }

  /**
   * Add entry to batch queue
   */
  private addToBatch(entry: ErrorLogEntry): void {
    this.batchQueue.push(entry);

    if (this.batchQueue.length >= this.config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(
        () => this.flushBatch(),
        this.config.batchFlushInterval
      );
    }
  }

  /**
   * Main log method
   */
  async log(entry: ErrorLogEntry): Promise<string | null> {
    if (!this.shouldLog(entry.level)) {
      return null;
    }

    const enrichedEntry = this.enrichEntry(entry);

    // Console logging (if enabled)
    if (this.config.consoleLogging) {
      await this.consoleAdapter.write(enrichedEntry);
    }

    // Batch or immediate write
    if (this.config.batchEnabled) {
      this.addToBatch(enrichedEntry);
      return 'batched';
    }

    const result = await this.writeWithRetry(enrichedEntry);

    if (!result.success) {
      logger.warn('[ErrorLoggingService] Failed to log error', {
        error: result.error,
        message: entry.message,
      });
      return null;
    }

    return result.data || null;
  }

  // ============================================================
  // Convenience methods for different log levels
  // ============================================================

  async debug(
    message: string,
    options: PartialErrorLogEntry = {}
  ): Promise<string | null> {
    return this.log({
      level: 'debug',
      source: 'client',
      message,
      ...options,
    });
  }

  async info(
    message: string,
    options: PartialErrorLogEntry = {}
  ): Promise<string | null> {
    return this.log({
      level: 'info',
      source: 'client',
      message,
      ...options,
    });
  }

  async warn(
    message: string,
    options: PartialErrorLogEntry = {}
  ): Promise<string | null> {
    return this.log({
      level: 'warn',
      source: 'client',
      message,
      ...options,
    });
  }

  async error(
    message: string,
    options: PartialErrorLogEntry & { error?: unknown } = {}
  ): Promise<string | null> {
    const { error: errorObj, ...rest } = options;

    return this.log({
      level: 'error',
      source: 'client',
      message,
      stackTrace: extractStackTrace(errorObj),
      ...rest,
    });
  }

  async fatal(
    message: string,
    options: PartialErrorLogEntry & { error?: unknown } = {}
  ): Promise<string | null> {
    const { error: errorObj, ...rest } = options;

    return this.log({
      level: 'fatal',
      source: 'client',
      message,
      stackTrace: extractStackTrace(errorObj),
      ...rest,
    });
  }

  // ============================================================
  // API Error helpers
  // ============================================================

  /**
   * Log an API error with request context
   */
  async logApiError(
    message: string,
    options: {
      endpoint: string;
      method?: string;
      statusCode?: number;
      error?: unknown;
      details?: Record<string, unknown>;
    }
  ): Promise<string | null> {
    return this.log({
      level: 'error',
      source: 'client',
      message,
      endpoint: options.endpoint,
      method: options.method,
      statusCode: options.statusCode,
      stackTrace: extractStackTrace(options.error),
      details: options.details,
    });
  }

  /**
   * Log a database error
   */
  async logDatabaseError(
    message: string,
    options: {
      errorCode?: string;
      error?: unknown;
      details?: Record<string, unknown>;
    }
  ): Promise<string | null> {
    return this.log({
      level: 'error',
      source: 'database',
      message,
      errorCode: options.errorCode,
      stackTrace: extractStackTrace(options.error),
      details: options.details,
    });
  }

  /**
   * Log an edge function error
   */
  async logEdgeFunctionError(
    functionName: string,
    message: string,
    options: {
      statusCode?: number;
      error?: unknown;
      details?: Record<string, unknown>;
    } = {}
  ): Promise<string | null> {
    return this.log({
      level: 'error',
      source: 'edge_function',
      message,
      endpoint: `/functions/v1/${functionName}`,
      statusCode: options.statusCode,
      stackTrace: extractStackTrace(options.error),
      details: options.details,
    });
  }

  // ============================================================
  // Query methods (for admin UI)
  // ============================================================

  async query(
    filters: ErrorLogFilters = {},
    page = 1,
    pageSize = 50
  ): Promise<PaginatedErrorLogs | null> {
    const result = await this.adapter.query(filters, page, pageSize);
    if (!result.success) {
      logger.error('[ErrorLoggingService] Query failed', { error: result.error });
      return null;
    }
    return result.data || null;
  }

  async getById(id: string): Promise<StoredErrorLog | null> {
    const result = await this.adapter.getById(id);
    if (!result.success) {
      logger.error('[ErrorLoggingService] getById failed', { error: result.error });
      return null;
    }
    return result.data || null;
  }

  async getSummary(dateFrom?: string, dateTo?: string) {
    const result = await this.adapter.getSummary(dateFrom, dateTo);
    if (!result.success) {
      logger.error('[ErrorLoggingService] getSummary failed', { error: result.error });
      return null;
    }
    return result.data || null;
  }

  // ============================================================
  // Lifecycle methods
  // ============================================================

  /**
   * Flush any pending batched logs
   */
  async flush(): Promise<void> {
    await this.flushBatch();
  }

  /**
   * Check if the logging backend is healthy
   */
  async healthCheck(): Promise<boolean> {
    const result = await this.adapter.healthCheck();
    return result.success && result.data === true;
  }
}

// ============================================================
// Factory function for creating configured service
// ============================================================

export type ErrorLoggingAdapterType = 'supabase' | 'console' | 'noop';

export interface CreateErrorLoggingServiceOptions {
  adapterType?: ErrorLoggingAdapterType;
  config?: Partial<ErrorLoggingConfig>;
}

/**
 * Create the error logging service with the specified adapter
 *
 * Note: For Supabase adapter, use createSupabaseErrorLoggingService
 * which properly initializes with the Supabase client.
 */
export function createErrorLoggingService(
  adapter: ErrorLogAdapter,
  config?: Partial<ErrorLoggingConfig>
): ErrorLoggingService {
  return new ErrorLoggingService(adapter, config);
}
