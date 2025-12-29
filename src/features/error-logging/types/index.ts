/**
 * Error Logging Types
 *
 * Type definitions for the error logging system.
 * These types are backend-agnostic and can be used with any logging provider.
 */

/**
 * Error severity levels
 */
export type ErrorLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Error source/origin
 */
export type ErrorLogSource =
  | 'client'
  | 'edge_function'
  | 'database'
  | 'external_service';

/**
 * Error log entry - the data we capture for each error
 */
export interface ErrorLogEntry {
  // Classification
  level: ErrorLogLevel;
  source: ErrorLogSource;

  // Error details
  message: string;
  errorCode?: string;
  stackTrace?: string;
  details?: Record<string, unknown>;

  // Request context
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;

  // User context
  userId?: string;
  sessionId?: string;

  // Client context
  userAgent?: string;
  ipAddress?: string;
  pageUrl?: string;

  // Environment
  environment?: 'development' | 'staging' | 'production';
  appVersion?: string;

  // Flexible metadata
  metadata?: Record<string, unknown>;
}

/**
 * Stored error log - includes database-generated fields
 */
export interface StoredErrorLog extends ErrorLogEntry {
  id: string;
  createdAt: string;
}

/**
 * Filter options for querying error logs
 */
export interface ErrorLogFilters {
  levels?: ErrorLogLevel[];
  sources?: ErrorLogSource[];
  userId?: string;
  errorCode?: string;
  endpoint?: string;
  environment?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Paginated error log response
 */
export interface PaginatedErrorLogs {
  data: StoredErrorLog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Error log summary for dashboard
 */
export interface ErrorLogSummary {
  level: ErrorLogLevel;
  count: number;
}

/**
 * Configuration for error logging adapters
 */
export interface ErrorLoggingConfig {
  /** Whether logging is enabled */
  enabled: boolean;

  /** Minimum level to log (logs below this level are ignored) */
  minLevel: ErrorLogLevel;

  /** Maximum number of retry attempts for failed log writes */
  maxRetries: number;

  /** Whether to batch logs for bulk insert */
  batchEnabled: boolean;

  /** Batch size before flushing */
  batchSize: number;

  /** Maximum time to wait before flushing batch (ms) */
  batchFlushInterval: number;

  /** Whether to log to console in addition to backend */
  consoleLogging: boolean;

  /** Fields to redact from logs (for security) */
  redactFields: string[];
}

/**
 * Default configuration
 */
export const DEFAULT_ERROR_LOGGING_CONFIG: ErrorLoggingConfig = {
  enabled: true,
  minLevel: 'warn',
  maxRetries: 2,
  batchEnabled: false,
  batchSize: 10,
  batchFlushInterval: 5000,
  consoleLogging: import.meta.env.DEV,
  redactFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
};

/**
 * Level priority for filtering
 */
export const LOG_LEVEL_PRIORITY: Record<ErrorLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Display configuration for error levels
 */
export const ERROR_LEVEL_CONFIG: Record<
  ErrorLogLevel,
  { label: string; color: string; icon: string }
> = {
  debug: { label: 'Debug', color: 'text-gray-400', icon: 'Bug' },
  info: { label: 'Info', color: 'text-blue-400', icon: 'Info' },
  warn: { label: 'Warning', color: 'text-yellow-400', icon: 'AlertTriangle' },
  error: { label: 'Error', color: 'text-red-400', icon: 'XCircle' },
  fatal: { label: 'Fatal', color: 'text-red-600', icon: 'Skull' },
};

/**
 * Display configuration for error sources
 */
export const ERROR_SOURCE_CONFIG: Record<
  ErrorLogSource,
  { label: string; color: string }
> = {
  client: { label: 'Client', color: 'text-blue-400' },
  edge_function: { label: 'Edge Function', color: 'text-purple-400' },
  database: { label: 'Database', color: 'text-green-400' },
  external_service: { label: 'External Service', color: 'text-orange-400' },
};
