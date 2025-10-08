/**
 * Session persistence utilities for "Remember Device" functionality
 */

const REMEMBER_DEVICE_KEY = 'fm_remember_device';
const REMEMBER_EXPIRES_KEY = 'fm_remember_expires';
const SESSION_START_KEY = 'fm_session_start';

export const sessionPersistence = {
  /**
   * Set the remember device preference
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
    // Always record when the session started
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
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
   * Check if current session has exceeded the default timeout (1 hour)
   */
  isSessionExpired: (): boolean => {
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    if (!sessionStart) return true;

    const now = Date.now();
    const start = parseInt(sessionStart, 10);
    const oneHour = 60 * 60 * 1000;

    return (now - start) > oneHour;
  },

  /**
   * Update session start time (call on fresh login)
   */
  updateSessionStart: () => {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  },

  /**
   * Clear remember device preference
   */
  clearRememberDevice: () => {
    localStorage.removeItem(REMEMBER_DEVICE_KEY);
    localStorage.removeItem(REMEMBER_EXPIRES_KEY);
    localStorage.removeItem(SESSION_START_KEY);
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
  }
};