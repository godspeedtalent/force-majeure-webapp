/**
 * Session persistence utilities for "Remember Device" functionality
 *
 * Note: Supabase handles session persistence automatically via localStorage
 * and manages token refresh. This utility only tracks user preference for
 * the "Remember Me" checkbox state for UI purposes.
 */
const REMEMBER_DEVICE_KEY = 'fm_remember_device';
const REMEMBER_EXPIRES_KEY = 'fm_remember_expires';
export const sessionPersistence = {
    /**
     * Set the remember device preference
     * This is tracked for UI purposes only - Supabase handles actual session persistence
     */
    setRememberDevice: (remember) => {
        if (remember) {
            const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
            localStorage.setItem(REMEMBER_DEVICE_KEY, 'true');
            localStorage.setItem(REMEMBER_EXPIRES_KEY, expiryTime.toString());
        }
        else {
            localStorage.removeItem(REMEMBER_DEVICE_KEY);
            localStorage.removeItem(REMEMBER_EXPIRES_KEY);
        }
    },
    /**
     * Check if device should be remembered and hasn't expired
     */
    shouldRememberDevice: () => {
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
    getRemainingDays: () => {
        const expiryTime = localStorage.getItem(REMEMBER_EXPIRES_KEY);
        if (!expiryTime)
            return 0;
        const now = Date.now();
        const expiry = parseInt(expiryTime, 10);
        const remaining = expiry - now;
        return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
    },
};
