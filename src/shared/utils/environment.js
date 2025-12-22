/**
 * Environment utilities for feature flag management and environment detection
 */
/**
 * Get the current environment from Vite
 * @returns 'development' or 'production'
 */
export const getEnvironment = () => {
    return import.meta.env.MODE === 'production' ? 'production' : 'development';
};
/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
    return getEnvironment() === 'development';
};
/**
 * Check if running in production mode
 */
export const isProduction = () => {
    return getEnvironment() === 'production';
};
/**
 * Convert Vite environment to feature flag environment
 * @returns 'dev' or 'prod'
 */
export const getFeatureFlagEnvironment = () => {
    return isProduction() ? 'prod' : 'dev';
};
/**
 * Get environment-specific override from .env
 * Only works in development mode for safety
 */
export const getEnvironmentOverride = (flagName) => {
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
export const ENVIRONMENT_LABELS = {
    dev: 'Development',
    prod: 'Production',
    all: 'All Environments',
};
