import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFeatureFlags, useFeatureFlagHelpers } from './useFeatureFlags';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock Supabase
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock environment service
vi.mock('@/shared/services/environmentService', () => ({
  environmentService: {
    getCurrentEnvironment: vi.fn(),
  },
}));

// Mock environment utils
vi.mock('@/shared/utils/environment', () => ({
  getEnvironmentOverride: vi.fn().mockReturnValue(null),
  isDevelopment: vi.fn().mockReturnValue(false),
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    createNamespace: () => ({
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import { supabase } from '@/api/supabase/client';
import { environmentService } from '@/services/environmentService';
import { isDevelopment, getEnvironmentOverride } from '@/utils/environment';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty state when environment not found', async () => {
    vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue(null);

    const { result } = renderHook(() => useFeatureFlags(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // All flags should be false
    expect(result.current.data).toBeDefined();
  });

  it('should fetch flags for current environment', async () => {
    vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
      id: 'env-1',
      name: 'development',
    } as any);

    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'all-env' }, error: null }),
      in: vi.fn().mockResolvedValue({
        data: [
          { flag_name: 'global_search', is_enabled: true, environment: { name: 'development' } },
          { flag_name: 'scavenger_hunt', is_enabled: false, environment: { name: 'development' } },
        ],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const { result } = renderHook(() => useFeatureFlags(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.global_search).toBe(true);
    expect(result.current.data?.scavenger_hunt).toBe(false);
  });

  it('should throw on fetch error', async () => {
    vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
      id: 'env-1',
      name: 'development',
    } as any);

    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      in: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const { result } = renderHook(() => useFeatureFlags(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should apply environment overrides in development', async () => {
    vi.mocked(isDevelopment).mockReturnValue(true);
    vi.mocked(getEnvironmentOverride).mockImplementation((flagKey: string) => {
      if (flagKey === 'global_search') return true;
      return null;
    });

    vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
      id: 'env-1',
      name: 'development',
    } as any);

    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      in: vi.fn().mockResolvedValue({
        data: [
          { flag_name: 'global_search', is_enabled: false, environment: { name: 'development' } },
        ],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const { result } = renderHook(() => useFeatureFlags(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Override should set to true even though DB says false
    expect(result.current.data?.global_search).toBe(true);
  });
});

describe('useFeatureFlagHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isDevelopment).mockReturnValue(false);
    vi.mocked(getEnvironmentOverride).mockReturnValue(null);
  });

  describe('isFeatureEnabled', () => {
    it('should return true when flag is enabled', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: true, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      expect(result.current.isFeatureEnabled(FEATURE_FLAGS.GLOBAL_SEARCH)).toBe(true);
    });

    it('should return false when flag is disabled', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: false, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      expect(result.current.isFeatureEnabled(FEATURE_FLAGS.GLOBAL_SEARCH)).toBe(false);
    });

    it('should return false when flags not loaded', () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue(null);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      // Before loading
      expect(result.current.isFeatureEnabled(FEATURE_FLAGS.GLOBAL_SEARCH)).toBe(false);
    });
  });

  describe('isAnyFeatureEnabled', () => {
    it('should return true when at least one flag is enabled', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: true, environment: { name: 'development' } },
            { flag_name: 'scavenger_hunt', is_enabled: false, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      expect(
        result.current.isAnyFeatureEnabled(
          FEATURE_FLAGS.GLOBAL_SEARCH,
          FEATURE_FLAGS.SCAVENGER_HUNT
        )
      ).toBe(true);
    });

    it('should return false when no flags are enabled', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: false, environment: { name: 'development' } },
            { flag_name: 'scavenger_hunt', is_enabled: false, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      expect(
        result.current.isAnyFeatureEnabled(
          FEATURE_FLAGS.GLOBAL_SEARCH,
          FEATURE_FLAGS.SCAVENGER_HUNT
        )
      ).toBe(false);
    });
  });

  describe('areAllFeaturesEnabled', () => {
    it('should return true when all flags are enabled', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: true, environment: { name: 'development' } },
            { flag_name: 'scavenger_hunt', is_enabled: true, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      expect(
        result.current.areAllFeaturesEnabled(
          FEATURE_FLAGS.GLOBAL_SEARCH,
          FEATURE_FLAGS.SCAVENGER_HUNT
        )
      ).toBe(true);
    });

    it('should return false when one flag is disabled', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: true, environment: { name: 'development' } },
            { flag_name: 'scavenger_hunt', is_enabled: false, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      expect(
        result.current.areAllFeaturesEnabled(
          FEATURE_FLAGS.GLOBAL_SEARCH,
          FEATURE_FLAGS.SCAVENGER_HUNT
        )
      ).toBe(false);
    });
  });

  describe('getEnabledFeatures', () => {
    it('should return list of enabled flags', async () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue({
        id: 'env-1',
        name: 'development',
      } as any);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({
          data: [
            { flag_name: 'global_search', is_enabled: true, environment: { name: 'development' } },
            { flag_name: 'scavenger_hunt', is_enabled: false, environment: { name: 'development' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.flags).toBeDefined();
      });

      const enabledFeatures = result.current.getEnabledFeatures();
      expect(enabledFeatures).toContain(FEATURE_FLAGS.GLOBAL_SEARCH);
      expect(enabledFeatures).not.toContain(FEATURE_FLAGS.SCAVENGER_HUNT);
    });

    it('should return empty array when no flags loaded', () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockResolvedValue(null);

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      expect(result.current.getEnabledFeatures()).toEqual([]);
    });
  });

  describe('isLoading', () => {
    it('should return true while loading', () => {
      vi.mocked(environmentService.getCurrentEnvironment).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useFeatureFlagHelpers(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
