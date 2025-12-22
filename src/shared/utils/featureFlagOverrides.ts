/**
 * Session-based feature flag overrides for development/admin use
 * These overrides are stored in sessionStorage and only affect the current browser session
 */

import { logger } from '@/shared/services/logger';

const OVERRIDE_KEY_PREFIX = 'ff_override_';

/**
 * Set a session-based override for a specific feature flag
 * This override will persist for the current browser session only
 *
 * @param flagName - The feature flag to override
 * @param value - The override value (true/false)
 */
export const setFeatureFlagOverride = (flagName: string, value: boolean): void => {
  try {
    sessionStorage.setItem(`${OVERRIDE_KEY_PREFIX}${flagName}`, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to set feature flag override', { error: error instanceof Error ? error.message : 'Unknown', source: 'featureFlagOverrides' });
  }
};

/**
 * Get the session-based override for a specific feature flag
 * Returns null if no override is set
 *
 * @param flagName - The feature flag to check
 * @returns The override value, or null if not set
 */
export const getFeatureFlagOverride = (flagName: string): boolean | null => {
  try {
    const value = sessionStorage.getItem(`${OVERRIDE_KEY_PREFIX}${flagName}`);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (error) {
    logger.error('Failed to get feature flag override', { error: error instanceof Error ? error.message : 'Unknown', source: 'featureFlagOverrides' });
    return null;
  }
};

/**
 * Clear the session-based override for a specific feature flag
 *
 * @param flagName - The feature flag to clear
 */
export const clearFeatureFlagOverride = (flagName: string): void => {
  try {
    sessionStorage.removeItem(`${OVERRIDE_KEY_PREFIX}${flagName}`);
  } catch (error) {
    logger.error('Failed to clear feature flag override', { error: error instanceof Error ? error.message : 'Unknown', source: 'featureFlagOverrides' });
  }
};

/**
 * Check if a session-based override exists for a feature flag
 *
 * @param flagName - The feature flag to check
 * @returns true if an override exists
 */
export const hasFeatureFlagOverride = (flagName: string): boolean => {
  return getFeatureFlagOverride(flagName) !== null;
};

/**
 * Clear all session-based feature flag overrides
 */
export const clearAllFeatureFlagOverrides = (): void => {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(OVERRIDE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    logger.error('Failed to clear all feature flag overrides', { error: error instanceof Error ? error.message : 'Unknown', source: 'featureFlagOverrides' });
  }
};

/**
 * Get all active session-based overrides
 *
 * @returns Object mapping flag names to override values
 */
export const getAllFeatureFlagOverrides = (): Record<string, boolean> => {
  const overrides: Record<string, boolean> = {};
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(OVERRIDE_KEY_PREFIX)) {
        const flagName = key.replace(OVERRIDE_KEY_PREFIX, '');
        const value = getFeatureFlagOverride(flagName);
        if (value !== null) {
          overrides[flagName] = value;
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get all feature flag overrides', { error: error instanceof Error ? error.message : 'Unknown', source: 'featureFlagOverrides' });
  }
  return overrides;
};
