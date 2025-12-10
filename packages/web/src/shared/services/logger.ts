/**
 * Centralized Logging Service
 *
 * Provides a clean API for logging throughout the application with:
 * - Automatic environment checking (logs only in development)
 * - Structured logging with context objects
 * - Optional namespacing for different modules
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Color coding in development mode
 *
 * Usage:
 * ```typescript
 * import { logger } from '@force-majeure/shared';
 *
 * logger.debug('Feature flags loaded', { flags });
 * logger.info('User signed up', { userId });
 * logger.warn('PDF generation not implemented', { orderId });
 * logger.error('API call failed', { error, endpoint });
 *
 * // With namespace
 * const authLogger = logger.namespace('Auth');
 * authLogger.info('Sign up successful', { userId });
 * ```
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private namespace?: string;

  constructor(namespace?: string) {
    this.isDevelopment = import.meta.env.DEV;
    this.namespace = namespace;
  }

  /**
   * Create a namespaced logger instance
   * Note: Renamed from 'namespace' to avoid conflict with class property
   */
  createNamespace(name: string): Logger {
    return new Logger(name);
  }

  /**
   * Alias for createNamespace (for backwards compatibility)
   * @deprecated Use createNamespace instead (naming conflict with property)
   */
  ns(name: string): Logger {
    return this.createNamespace(name);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context, 'color: #9CA3AF');
    }
  }

  /**
   * Log an informational message (only in development)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('INFO', message, context, 'color: #3B82F6');
    }
  }

  /**
   * Log a warning message (only in development)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('WARN', message, context, 'color: #F59E0B');
    }
  }

  /**
   * Log an error message (logs in all environments)
   */
  error(message: string, context?: LogContext): void {
    // Errors are logged in all environments
    this.log('ERROR', message, context, 'color: #EF4444', true);
  }

  /**
   * Internal logging implementation
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    style?: string,
    forceLog = false
  ): void {
    // Only log if in development or forced (for errors)
    if (!this.isDevelopment && !forceLog) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = this.namespace ? `[${this.namespace}]` : '';
    const emoji = this.getLevelEmoji(level);

    // Format the log message
    const logMessage = `${timestamp} ${emoji} ${level} ${prefix} ${message}`;

    // Choose console method based on level
    const consoleMethod = this.getConsoleMethod(level);

    // Serialize context to properly handle nested objects
    const serializedContext = context ? this.serializeContext(context) : undefined;

    // Log with styling in development
    if (this.isDevelopment && style) {
      consoleMethod(`%c${logMessage}`, style);
      if (serializedContext) {
        console.log('Context:', serializedContext);
      }
    } else {
      // Simple logging for production errors
      consoleMethod(logMessage);
      if (serializedContext) {
        consoleMethod('Context:', serializedContext);
      }
    }
  }

  /**
   * Serialize context objects to handle nested objects and errors properly
   */
  private serializeContext(context: LogContext): LogContext {
    const serialized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      if (value === null || value === undefined) {
        serialized[key] = value;
      } else if (value instanceof Error) {
        // Serialize Error objects
        serialized[key] = {
          message: value.message,
          name: value.name,
          stack: value.stack,
        };
      } else if (typeof value === 'object') {
        try {
          // Try to stringify and parse to ensure it's serializable
          serialized[key] = JSON.parse(JSON.stringify(value));
        } catch {
          // If serialization fails, convert to string
          serialized[key] = String(value);
        }
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return '🔍';
      case 'INFO':
        return 'ℹ️';
      case 'WARN':
        return '⚠️';
      case 'ERROR':
        return '❌';
      default:
        return '📝';
    }
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case 'ERROR':
        return console.error.bind(console);
      case 'WARN':
        return console.warn.bind(console);
      case 'INFO':
      case 'DEBUG':
      default:
        return console.log.bind(console);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };
