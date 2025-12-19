import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEnvironment,
  isDevelopment,
  isProduction,
  getFeatureFlagEnvironment,
  getEnvironmentOverride,
  ENVIRONMENT_LABELS,
} from './environment';

describe('getEnvironment', () => {
  it('returns production when MODE is production', () => {
    vi.stubEnv('MODE', 'production');
    expect(getEnvironment()).toBe('production');
  });

  it('returns development when MODE is not production', () => {
    vi.stubEnv('MODE', 'development');
    expect(getEnvironment()).toBe('development');
  });

  it('returns development when MODE is undefined', () => {
    vi.stubEnv('MODE', undefined);
    expect(getEnvironment()).toBe('development');
  });

  it('returns development for test mode', () => {
    vi.stubEnv('MODE', 'test');
    expect(getEnvironment()).toBe('development');
  });
});

describe('isDevelopment', () => {
  it('returns true in development mode', () => {
    vi.stubEnv('MODE', 'development');
    expect(isDevelopment()).toBe(true);
  });

  it('returns false in production mode', () => {
    vi.stubEnv('MODE', 'production');
    expect(isDevelopment()).toBe(false);
  });
});

describe('isProduction', () => {
  it('returns true in production mode', () => {
    vi.stubEnv('MODE', 'production');
    expect(isProduction()).toBe(true);
  });

  it('returns false in development mode', () => {
    vi.stubEnv('MODE', 'development');
    expect(isProduction()).toBe(false);
  });
});

describe('getFeatureFlagEnvironment', () => {
  it('returns prod in production mode', () => {
    vi.stubEnv('MODE', 'production');
    expect(getFeatureFlagEnvironment()).toBe('prod');
  });

  it('returns dev in development mode', () => {
    vi.stubEnv('MODE', 'development');
    expect(getFeatureFlagEnvironment()).toBe('dev');
  });
});

describe('getEnvironmentOverride', () => {
  beforeEach(() => {
    vi.stubEnv('MODE', 'development');
  });

  it('returns null in production mode', () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_FF_TEST_FLAG', 'true');
    expect(getEnvironmentOverride('TEST_FLAG')).toBe(null);
  });

  it('returns null when env variable is not set', () => {
    vi.stubEnv('MODE', 'development');
    expect(getEnvironmentOverride('NONEXISTENT_FLAG')).toBe(null);
  });

  it('returns true when env variable is "true"', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_FF_TEST_FLAG', 'true');
    expect(getEnvironmentOverride('TEST_FLAG')).toBe(true);
  });

  it('returns true when env variable is "1"', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_FF_TEST_FLAG', '1');
    expect(getEnvironmentOverride('TEST_FLAG')).toBe(true);
  });

  it('returns false when env variable is "false"', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_FF_TEST_FLAG', 'false');
    expect(getEnvironmentOverride('TEST_FLAG')).toBe(false);
  });

  it('returns false when env variable is "0"', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_FF_TEST_FLAG', '0');
    expect(getEnvironmentOverride('TEST_FLAG')).toBe(false);
  });

  it('converts flag name to uppercase for env key', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_FF_MY_FEATURE', 'true');
    expect(getEnvironmentOverride('my_feature')).toBe(true);
  });
});

describe('ENVIRONMENT_LABELS', () => {
  it('has correct label for dev', () => {
    expect(ENVIRONMENT_LABELS.dev).toBe('Development');
  });

  it('has correct label for prod', () => {
    expect(ENVIRONMENT_LABELS.prod).toBe('Production');
  });

  it('has correct label for all', () => {
    expect(ENVIRONMENT_LABELS.all).toBe('All Environments');
  });

  it('has all required environment labels', () => {
    expect(Object.keys(ENVIRONMENT_LABELS)).toEqual(['dev', 'prod', 'all']);
  });
});
