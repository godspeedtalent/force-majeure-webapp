import { useState, useCallback, useEffect } from 'react';

/**
 * Safe localStorage access hook with SSR/private browsing support.
 * 
 * @param key - localStorage key
 * @param defaultValue - fallback value if key doesn't exist or localStorage is unavailable
 * @returns [value, setValue, removeValue]
 * 
 * @example
 * ```tsx
 * const [width, setWidth] = useLocalStorage('drawer-width', 384);
 * setWidth(500);
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      // localStorage not available (SSR, private browsing, etc.)
      return defaultValue;
    }
  });

  // Persist to localStorage whenever value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // Ignore write errors (quota exceeded, private browsing, etc.)
        }
        return nextValue;
      });
    },
    [key]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
