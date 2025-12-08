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
 * import { webStorage } from '@/shared/adapters/storage';
 * await webStorage.setItem('key', 'value');
 *
 * // Mobile implementation (in mobile app)
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const mobileStorage: StorageAdapter = AsyncStorage;
 * ```
 */

/**
 * Storage adapter interface for platform-agnostic storage operations.
 * Matches the AsyncStorage API for seamless mobile compatibility.
 */
export interface StorageAdapter {
  /**
   * Retrieve an item from storage
   * @param key - The key to retrieve
   * @returns The stored value, or null if not found
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Store an item in storage
   * @param key - The key to store
   * @param value - The value to store (must be a string)
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove an item from storage
   * @param key - The key to remove
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all items from storage (optional)
   * Note: Not all implementations support this
   */
  clear?(): Promise<void>;

  /**
   * Get all keys in storage (optional)
   * Note: Not all implementations support this
   */
  getAllKeys?(): Promise<readonly string[]>;

  /**
   * Get multiple items at once (optional)
   * Note: Not all implementations support this
   */
  multiGet?(keys: readonly string[]): Promise<readonly [string, string | null][]>;

  /**
   * Set multiple items at once (optional)
   * Note: Not all implementations support this
   */
  multiSet?(keyValuePairs: readonly [string, string][]): Promise<void>;

  /**
   * Remove multiple items at once (optional)
   * Note: Not all implementations support this
   */
  multiRemove?(keys: readonly string[]): Promise<void>;
}

/**
 * Web implementation of StorageAdapter using localStorage.
 * This wraps synchronous localStorage methods in async wrappers
 * to match the StorageAdapter interface.
 */
export const webStorage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      // localStorage may throw in private browsing mode
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage may throw when quota is exceeded
      console.warn(`Failed to save "${key}" to localStorage`);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors during removal
    }
  },

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch {
      // Ignore errors
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },

  async multiGet(keys: readonly string[]): Promise<readonly [string, string | null][]> {
    return keys.map(key => [key, localStorage.getItem(key)] as [string, string | null]);
  },

  async multiSet(keyValuePairs: readonly [string, string][]): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  },

  async multiRemove(keys: readonly string[]): Promise<void> {
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
export function createTypedStorage<T>(
  key: string,
  storageAdapter: StorageAdapter = storage
) {
  return {
    async get(): Promise<T | null> {
      const value = await storageAdapter.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },

    async set(value: T): Promise<void> {
      await storageAdapter.setItem(key, JSON.stringify(value));
    },

    async remove(): Promise<void> {
      await storageAdapter.removeItem(key);
    },

    async update(updater: (current: T | null) => T): Promise<void> {
      const current = await this.get();
      const updated = updater(current);
      await this.set(updated);
    },
  };
}

/**
 * Type for secure storage (used for sensitive data like tokens).
 * On mobile, this would use expo-secure-store or react-native-keychain.
 * On web, this falls back to localStorage (less secure).
 */
export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Web fallback for secure storage.
 * Note: localStorage is not truly secure, but it's the best option on web.
 * Consider using HttpOnly cookies for sensitive tokens on web.
 */
export const webSecureStorage: SecureStorageAdapter = webStorage;
