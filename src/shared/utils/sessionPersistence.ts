/**
 * Session persistence utilities for "Remember Device" functionality
 *
 * IMPORTANT LIMITATIONS:
 * ----------------------
 * This utility tracks the user's "Remember Me" checkbox preference for UI purposes ONLY.
 * It does NOT actually extend the Supabase session duration.
 *
 * What this DOES:
 * - Stores user's checkbox preference in localStorage
 * - Tracks when the preference was set (30-day expiry)
 * - Pre-fills the checkbox on next visit if still valid
 *
 * What this does NOT do:
 * - Extend Supabase session duration (controlled by Supabase project settings)
 * - Prevent session expiration (Supabase manages token refresh automatically)
 * - Provide actual 30-day sessions (Supabase default is typically 7 days)
 *
 * To actually extend session duration:
 * - Configure JWT expiry in Supabase Dashboard > Auth > Settings
 * - Or implement custom token refresh logic with Supabase's refreshSession()
 *
 * Security Note:
 * The expiry time stored in localStorage could be tampered with by users,
 * but since this only affects UI state (checkbox pre-fill), there's no
 * security impact. Actual session validity is enforced by Supabase server.
 */

const REMEMBER_DEVICE_KEY = 'fm_remember_device';
const REMEMBER_EXPIRES_KEY = 'fm_remember_expires';

export const sessionPersistence = {
  /**
   * Set the remember device preference
   * This is tracked for UI purposes only - Supabase handles actual session persistence
   */
  setRememberDevice: (remember: boolean) => {
    if (remember) {
      const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
      localStorage.setItem(REMEMBER_DEVICE_KEY, 'true');
      localStorage.setItem(REMEMBER_EXPIRES_KEY, expiryTime.toString());
    } else {
      localStorage.removeItem(REMEMBER_DEVICE_KEY);
      localStorage.removeItem(REMEMBER_EXPIRES_KEY);
    }
  },

  /**
   * Check if device should be remembered and hasn't expired
   */
  shouldRememberDevice: (): boolean => {
    const rememberFlag = localStorage.getItem(REMEMBER_DEVICE_KEY);
    const expiryTime = localStorage.getItem(REMEMBER_EXPIRES_KEY);

    if (!rememberFlag || !expiryTime) {
      return false;
    }

    const now = Date.now();
    const expiry = parseInt(expiryTime, 10);

    if (now > expiry) {
      // Expired, clean up
      sessionPersistence.clearRememberDevice();
      return false;
    }

    return true;
  },

  /**
   * Clear remember device preference
   */
  clearRememberDevice: () => {
    localStorage.removeItem(REMEMBER_DEVICE_KEY);
    localStorage.removeItem(REMEMBER_EXPIRES_KEY);
  },

  /**
   * Get remaining days for remember device
   */
  getRemainingDays: (): number => {
    const expiryTime = localStorage.getItem(REMEMBER_EXPIRES_KEY);
    if (!expiryTime) return 0;

    const now = Date.now();
    const expiry = parseInt(expiryTime, 10);
    const remaining = expiry - now;

    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  },
};
