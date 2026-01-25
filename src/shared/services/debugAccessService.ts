/**
 * Debug Access Service
 *
 * Centralized service for controlling debug information visibility.
 * Implements three-tier access control:
 *
 * 1. Local Developer Mode (VITE_DEBUG_MODE=true in .env.local)
 *    - For developers working on the codebase locally
 *    - Not committed to version control
 *
 * 2. Role-Based Access (admin/developer role)
 *    - For admins/developers in any environment
 *    - Determined by database roles after auth loads
 *
 * 3. Pre-Auth Buffer
 *    - Queues logs during auth loading
 *    - Flushes if user has access, discards otherwise
 *
 * Security behavior:
 * - Pre-auth state: Logs are buffered (not shown)
 * - Post-auth: Logs shown only for admin/developer roles
 * - Errors: Always logged (for monitoring)
 *
 * Usage:
 * ```typescript
 * import { debugAccessService } from '@/shared/services/debugAccessService';
 *
 * // Check if debug info should be shown
 * if (debugAccessService.hasDebugAccess()) {
 *   console.log('Debug info:', data);
 * }
 *
 * // Set access when user roles load (called by useUserRole)
 * debugAccessService.setDebugAccess(isAdminOrDeveloper);
 *
 * // Clear on logout
 * debugAccessService.clearDebugAccess();
 * ```
 */

// In-memory storage for debug access (survives outside React context)
// This cannot be tampered with via browser devtools unlike localStorage
let _hasDebugAccess = false;
let _authResolved = false;

// Pre-auth log buffer
interface BufferedLog {
  level: 'debug' | 'info' | 'warn';
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  namespace?: string;
}
const _logBuffer: BufferedLog[] = [];
const MAX_BUFFER_SIZE = 100;

export const debugAccessService = {
  /**
   * Check if LOCAL developer mode is enabled
   * This is for actual developers working on the codebase, not end users
   * Requires VITE_DEBUG_MODE=true in .env.local (not committed)
   */
  isLocalDeveloperMode(): boolean {
    return import.meta.env.VITE_DEBUG_MODE === 'true';
  },

  /**
   * Set debug access based on user role
   * Called by useUserRole when roles load
   */
  setDebugAccess(isDevOrAdmin: boolean): void {
    _hasDebugAccess = isDevOrAdmin;
    _authResolved = true;

    // Flush or discard buffered logs
    this.flushBuffer();
  },

  /**
   * Check if debug information should be displayed
   * Returns true if:
   * - Local developer mode is enabled (VITE_DEBUG_MODE=true), OR
   * - User has admin/developer role
   *
   * IMPORTANT: Does NOT auto-grant access in DEV environment
   * This ensures non-admin users don't see debug logs even during development
   */
  hasDebugAccess(): boolean {
    // Local developer mode always has access
    if (this.isLocalDeveloperMode()) return true;

    // Otherwise, check role-based access
    return _hasDebugAccess;
  },

  /**
   * Check if auth has resolved (roles are known)
   */
  isAuthResolved(): boolean {
    return _authResolved;
  },

  /**
   * Buffer a log message for later (pre-auth state)
   * Returns true if buffered, false if should log immediately
   */
  bufferLog(
    level: 'debug' | 'info' | 'warn',
    message: string,
    context?: Record<string, unknown>,
    namespace?: string
  ): boolean {
    // Don't buffer if auth is already resolved
    if (_authResolved) return false;

    // Don't buffer if local developer mode (they see everything anyway)
    if (this.isLocalDeveloperMode()) return false;

    if (_logBuffer.length >= MAX_BUFFER_SIZE) {
      // Drop oldest log to make room
      _logBuffer.shift();
    }

    _logBuffer.push({
      level,
      message,
      context,
      timestamp: Date.now(),
      namespace,
    });

    return true;
  },

  /**
   * Flush buffered logs (called when auth resolves)
   * Outputs logs if user has access, discards otherwise
   */
  flushBuffer(): void {
    if (!_hasDebugAccess && !this.isLocalDeveloperMode()) {
      // User doesn't have access - discard buffer silently
      _logBuffer.length = 0;
      return;
    }

    // User has access - output buffered logs
    if (_logBuffer.length > 0) {
      console.log(
        `%c[Debug] Flushing ${_logBuffer.length} buffered log(s)`,
        'color: #9CA3AF; font-style: italic'
      );

      _logBuffer.forEach(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const namespacePrefix = log.namespace ? `[${log.namespace}] ` : '';
        const levelEmoji =
          log.level === 'debug' ? '🔍' : log.level === 'info' ? 'ℹ️' : '⚠️';
        const levelColor =
          log.level === 'debug'
            ? '#9CA3AF'
            : log.level === 'info'
              ? '#3B82F6'
              : '#F59E0B';

        console.log(
          `%c[BUFFERED] ${timestamp} ${levelEmoji} ${log.level.toUpperCase()} ${namespacePrefix}${log.message}`,
          `color: ${levelColor}; font-style: italic`
        );
        if (log.context && Object.keys(log.context).length > 0) {
          console.log('Context:', log.context);
        }
      });
    }

    _logBuffer.length = 0;
  },

  /**
   * Clear debug access (call on logout)
   */
  clearDebugAccess(): void {
    _hasDebugAccess = false;
    _authResolved = false;
    _logBuffer.length = 0;
  },

  /**
   * Get buffer size (for testing)
   */
  getBufferSize(): number {
    return _logBuffer.length;
  },

  /**
   * Reset all state (for testing)
   */
  reset(): void {
    _hasDebugAccess = false;
    _authResolved = false;
    _logBuffer.length = 0;
  },
};
