/**
 * Centralized Logging Service
 *
 * Provides a clean API for logging throughout the application with:
 * - Three-tier access control: local dev mode, role-based, pre-auth buffering
 * - Structured logging with context objects
 * - Optional namespacing for different modules
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Color coding for visual distinction
 *
 * Access Control:
 * - Local Developer Mode (VITE_DEBUG_MODE=true): All logs shown immediately
 * - Role-Based Access (admin/developer): Logs shown after auth resolves
 * - Pre-Auth State: Logs buffered until auth resolves, then flushed or discarded
 * - Errors: Always logged (for monitoring)
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/shared';
 *
 * logger.debug('Feature flags loaded', { flags });
 * logger.info('User signed up', { userId });
 * logger.warn('PDF generation not implemented', { orderId });
 * logger.error('API call failed', { error, endpoint });
 *
 * // With namespace
 * const authLogger = logger.createNamespace('Auth');
 * authLogger.info('Sign up successful', { userId });
 * ```
 */

import { debugAccessService } from './debugAccessService';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

class Logger {
  private namespace?: string;

  constructor(namespace?: string) {
    this.namespace = namespace;
  }

  /**
   * Check if debug logging is allowed
   * Uses debugAccessService which checks local dev mode AND user role
   */
  private hasDebugAccess(): boolean {
    return debugAccessService.hasDebugAccess();
  }

  /**
   * Check if we should buffer this log (pre-auth state)
   */
  private shouldBuffer(): boolean {
    // Don't buffer if local developer mode - they see everything
    if (debugAccessService.isLocalDeveloperMode()) return false;

    // Don't buffer if auth has resolved - we know if user has access
    if (debugAccessService.isAuthResolved()) return false;

    // Auth not resolved yet - buffer the log
    return true;
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
   * Log a debug message (local dev mode or admin/developer role)
   * Buffers if auth state is not yet resolved
   */
  debug(message: string, context?: LogContext): void {
    // If auth not resolved, buffer for later
    if (this.shouldBuffer()) {
      debugAccessService.bufferLog(
        'debug',
        message,
        context as Record<string, unknown>,
        this.namespace
      );
      return;
    }

    if (this.hasDebugAccess()) {
      this.log('DEBUG', message, context, 'color: #9CA3AF');
    }
  }

  /**
   * Log an informational message (local dev mode or admin/developer role)
   * Buffers if auth state is not yet resolved
   */
  info(message: string, context?: LogContext): void {
    // If auth not resolved, buffer for later
    if (this.shouldBuffer()) {
      debugAccessService.bufferLog(
        'info',
        message,
        context as Record<string, unknown>,
        this.namespace
      );
      return;
    }

    if (this.hasDebugAccess()) {
      this.log('INFO', message, context, 'color: #3B82F6');
    }
  }

  /**
   * Log a warning message (local dev mode or admin/developer role)
   * Buffers if auth state is not yet resolved
   */
  warn(message: string, context?: LogContext): void {
    // If auth not resolved, buffer for later
    if (this.shouldBuffer()) {
      debugAccessService.bufferLog(
        'warn',
        message,
        context as Record<string, unknown>,
        this.namespace
      );
      return;
    }

    if (this.hasDebugAccess()) {
      this.log('WARN', message, context, 'color: #F59E0B');
    }
  }

  /**
   * Log an error message (logs in all environments, always visible)
   * Errors are NOT buffered - they always log immediately
   */
  error(message: string, context?: LogContext): void {
    // Errors are logged in all environments, never buffered
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
    // Only log if has debug access or forced (for errors)
    if (!this.hasDebugAccess() && !forceLog) {
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

    // Log with styling when debug access is available
    if (this.hasDebugAccess() && style) {
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
