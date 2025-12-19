/**
 * Storage Adapter Interface
 *
 * Platform-agnostic storage interface for cross-platform compatibility.
 * This allows the same code to work on both web (localStorage) and
 * mobile (AsyncStorage/SecureStore) platforms.
 *
 * Usage:
 * ```typescript
 * // Web implementation
 * import { webStorage } from '@/shared';
 * await webStorage.setItem('key', 'value');
 *
 * // Mobile implementation (in mobile app)
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const mobileStorage: StorageAdapter = AsyncStorage;
 * ```
 */
/**
 * Web implementation of StorageAdapter using localStorage.
 * This wraps synchronous localStorage methods in async wrappers
 * to match the StorageAdapter interface.
 */
export const webStorage = {
    async getItem(key) {
        try {
            return localStorage.getItem(key);
        }
        catch {
            // localStorage may throw in private browsing mode
            return null;
        }
    },
    async setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch {
            // localStorage may throw when quota is exceeded
            console.warn(`Failed to save "${key}" to localStorage`);
        }
    },
    async removeItem(key) {
        try {
            localStorage.removeItem(key);
        }
        catch {
            // Ignore errors during removal
        }
    },
    async clear() {
        try {
            localStorage.clear();
        }
        catch {
            // Ignore errors
        }
    },
    async getAllKeys() {
        try {
            return Object.keys(localStorage);
        }
        catch {
            return [];
        }
    },
    async multiGet(keys) {
        return keys.map(key => [key, localStorage.getItem(key)]);
    },
    async multiSet(keyValuePairs) {
        for (const [key, value] of keyValuePairs) {
            await this.setItem(key, value);
        }
    },
    async multiRemove(keys) {
        for (const key of keys) {
            await this.removeItem(key);
        }
    },
};
/**
 * Default storage adapter for the current platform.
 * In the web app, this is always webStorage.
 * In the mobile app, this would be overridden with AsyncStorage.
 */
export const storage = webStorage;
/**
 * Helper to create a typed storage wrapper for a specific data type.
 * Automatically handles JSON serialization/deserialization.
 *
 * Usage:
 * ```typescript
 * interface UserPrefs {
 *   theme: 'light' | 'dark';
 *   language: string;
 * }
 *
 * const userPrefsStorage = createTypedStorage<UserPrefs>('user-prefs');
 * await userPrefsStorage.set({ theme: 'dark', language: 'en' });
 * const prefs = await userPrefsStorage.get();
 * ```
 */
export function createTypedStorage(key, storageAdapter = storage) {
    return {
        async get() {
            const value = await storageAdapter.getItem(key);
            if (!value)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return null;
            }
        },
        async set(value) {
            await storageAdapter.setItem(key, JSON.stringify(value));
        },
        async remove() {
            await storageAdapter.removeItem(key);
        },
        async update(updater) {
            const current = await this.get();
            const updated = updater(current);
            await this.set(updated);
        },
    };
}
/**
 * Web fallback for secure storage.
 * Note: localStorage is not truly secure, but it's the best option on web.
 * Consider using HttpOnly cookies for sensitive tokens on web.
 */
export const webSecureStorage = webStorage;
