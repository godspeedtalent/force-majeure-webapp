/**
 * Debug Access Service
 *
 * Centralized service for controlling debug information visibility.
 * Implements dual-layer protection: environment check AND role check.
 *
 * Security behavior:
 * - Development builds: Always allow debug access (for development)
 * - Production builds: Only allow debug access for admin/developer roles
 * - Pre-auth state: Defaults to no debug access (safe default)
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

export const debugAccessService = {
  /**
   * Set debug access based on user role
   * Called by useUserRole when roles load
   */
  setDebugAccess(isDevOrAdmin: boolean): void {
    _hasDebugAccess = isDevOrAdmin;
  },

  /**
   * Check if debug information should be displayed
   * Returns true if:
   * - Running in development environment (import.meta.env.DEV), OR
   * - User has admin/developer role in production
   */
  hasDebugAccess(): boolean {
    // Dev environment always has access
    if (import.meta.env.DEV) return true;
    // In production, check stored role
    return _hasDebugAccess;
  },

  /**
   * Clear debug access (call on logout)
   */
  clearDebugAccess(): void {
    _hasDebugAccess = false;
  },
};
