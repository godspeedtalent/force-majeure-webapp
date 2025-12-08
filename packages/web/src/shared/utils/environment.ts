/**
 * Environment utilities for feature flag management and environment detection
 */

export type Environment = 'development' | 'production';
export type FeatureFlagEnvironment = 'dev' | 'prod' | 'all';

/**
 * Get the current environment from Vite
 * @returns 'development' or 'production'
 */
export const getEnvironment = (): Environment => {
  return import.meta.env.MODE === 'production' ? 'production' : 'development';
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Convert Vite environment to feature flag environment
 * @returns 'dev' or 'prod'
 */
export const getFeatureFlagEnvironment = (): FeatureFlagEnvironment => {
  return isProduction() ? 'prod' : 'dev';
};

/**
 * Get environment-specific override from .env
 * Only works in development mode for safety
 */
export const getEnvironmentOverride = (flagName: string): boolean | null => {
  if (!isDevelopment()) {
    return null;
  }

  const envKey = `VITE_FF_${flagName.toUpperCase()}`;
  const envValue = import.meta.env[envKey];

  if (envValue === undefined) {
    return null;
  }

  return envValue === 'true' || envValue === '1';
};

/**
 * Environment display names for UI
 */
export const ENVIRONMENT_LABELS: Record<FeatureFlagEnvironment, string> = {
  dev: 'Development',
  prod: 'Production',
  all: 'All Environments',
};
