import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/shared', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    createNamespace: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Import after mocks
import {
  environmentService,
  getCurrentEnvironmentName,
  getCurrentEnvironment,
  getAvailableEnvironments,
  isProduction,
  isDevelopment,
  isQA,
  type Environment,
} from './environmentService';
import { supabase } from '@/shared';

describe('environmentService', () => {
  const mockDevEnvironment: Environment = {
    id: 'env-dev',
    name: 'dev',
    display_name: 'Development',
    description: 'Development environment',
    is_active: true,
  };

  const mockProdEnvironment: Environment = {
    id: 'env-prod',
    name: 'prod',
    display_name: 'Production',
    description: 'Production environment',
    is_active: true,
  };

  const mockQAEnvironment: Environment = {
    id: 'env-qa',
    name: 'qa',
    display_name: 'QA',
    description: 'QA environment',
    is_active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    environmentService.clearCache();

    // Setup chainable mock
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnThis();
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ============================================================================
  // getCurrentEnvironmentName Tests
  // ============================================================================

  describe('getCurrentEnvironmentName', () => {
    it('should return VITE_ENVIRONMENT when set', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'prod');

      const result = environmentService.getCurrentEnvironmentName();

      expect(result).toBe('prod');
    });

    it('should cache the environment name', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'qa');

      const result1 = environmentService.getCurrentEnvironmentName();
      const result2 = environmentService.getCurrentEnvironmentName();

      expect(result1).toBe('qa');
      expect(result2).toBe('qa');
    });

    it('should detect dev from localhost hostname when no env var', () => {
      vi.stubEnv('VITE_ENVIRONMENT', '');

      // Mock window.location.hostname
      const originalHostname = window.location.hostname;
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      const result = environmentService.getCurrentEnvironmentName();
      expect(result).toBe('dev');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { hostname: originalHostname },
        writable: true,
      });
    });

    it('should detect dev from 127.0.0.1 hostname', () => {
      vi.stubEnv('VITE_ENVIRONMENT', '');
      environmentService.clearCache();

      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1' },
        writable: true,
      });

      const result = environmentService.getCurrentEnvironmentName();
      expect(result).toBe('dev');
    });

    it('should detect qa from hostname containing qa', () => {
      vi.stubEnv('VITE_ENVIRONMENT', '');
      environmentService.clearCache();

      Object.defineProperty(window, 'location', {
        value: { hostname: 'qa.example.com' },
        writable: true,
      });

      const result = environmentService.getCurrentEnvironmentName();
      expect(result).toBe('qa');
    });

    it('should detect qa from hostname containing staging', () => {
      vi.stubEnv('VITE_ENVIRONMENT', '');
      environmentService.clearCache();

      Object.defineProperty(window, 'location', {
        value: { hostname: 'staging.example.com' },
        writable: true,
      });

      const result = environmentService.getCurrentEnvironmentName();
      expect(result).toBe('qa');
    });

    it('should detect prod from hostname containing forcemajeure', () => {
      vi.stubEnv('VITE_ENVIRONMENT', '');
      environmentService.clearCache();

      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.forcemajeure.com' },
        writable: true,
      });

      const result = environmentService.getCurrentEnvironmentName();
      expect(result).toBe('prod');
    });

    it('should default to dev for unknown hostname', () => {
      vi.stubEnv('VITE_ENVIRONMENT', '');
      environmentService.clearCache();

      Object.defineProperty(window, 'location', {
        value: { hostname: 'unknown.example.com' },
        writable: true,
      });

      const result = environmentService.getCurrentEnvironmentName();
      expect(result).toBe('dev');
    });
  });

  // ============================================================================
  // getCurrentEnvironment Tests
  // ============================================================================

  describe('getCurrentEnvironment', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_ENVIRONMENT', 'dev');
    });

    it('should fetch current environment from database', async () => {
      mockSingle.mockResolvedValue({ data: mockDevEnvironment, error: null });

      const result = await environmentService.getCurrentEnvironment();

      expect(result).toEqual(mockDevEnvironment);
      expect(supabase.from).toHaveBeenCalledWith('environments');
      expect(mockEq).toHaveBeenCalledWith('name', 'dev');
    });

    it('should cache the environment after first fetch', async () => {
      mockSingle.mockResolvedValue({ data: mockDevEnvironment, error: null });

      const result1 = await environmentService.getCurrentEnvironment();
      const result2 = await environmentService.getCurrentEnvironment();

      expect(result1).toEqual(mockDevEnvironment);
      expect(result2).toEqual(mockDevEnvironment);
      // Should only query once
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('should return null on database error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await environmentService.getCurrentEnvironment();

      expect(result).toBeNull();
    });

    it('should return null on exception', async () => {
      mockSingle.mockRejectedValue(new Error('Network error'));

      const result = await environmentService.getCurrentEnvironment();

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // getAvailableEnvironments Tests
  // ============================================================================

  describe('getAvailableEnvironments', () => {
    it('should fetch all active environments', async () => {
      const mockEnvironments = [mockDevEnvironment, mockQAEnvironment, mockProdEnvironment];
      mockOrder.mockResolvedValue({ data: mockEnvironments, error: null });

      const result = await environmentService.getAvailableEnvironments();

      expect(result).toEqual(mockEnvironments);
      expect(supabase.from).toHaveBeenCalledWith('environments');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should cache environments after first fetch', async () => {
      const mockEnvironments = [mockDevEnvironment];
      mockOrder.mockResolvedValue({ data: mockEnvironments, error: null });

      const result1 = await environmentService.getAvailableEnvironments();
      const result2 = await environmentService.getAvailableEnvironments();

      expect(result1).toEqual(mockEnvironments);
      expect(result2).toEqual(mockEnvironments);
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on database error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await environmentService.getAvailableEnvironments();

      expect(result).toEqual([]);
    });

    it('should return empty array on exception', async () => {
      mockOrder.mockRejectedValue(new Error('Network error'));

      const result = await environmentService.getAvailableEnvironments();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await environmentService.getAvailableEnvironments();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // Helper Method Tests
  // ============================================================================

  describe('isProduction', () => {
    it('should return true when environment is prod', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'prod');
      environmentService.clearCache();

      expect(environmentService.isProduction()).toBe(true);
    });

    it('should return false when environment is not prod', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'dev');
      environmentService.clearCache();

      expect(environmentService.isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when environment is dev', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'dev');
      environmentService.clearCache();

      expect(environmentService.isDevelopment()).toBe(true);
    });

    it('should return false when environment is not dev', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'prod');
      environmentService.clearCache();

      expect(environmentService.isDevelopment()).toBe(false);
    });
  });

  describe('isQA', () => {
    it('should return true when environment is qa', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'qa');
      environmentService.clearCache();

      expect(environmentService.isQA()).toBe(true);
    });

    it('should return false when environment is not qa', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'dev');
      environmentService.clearCache();

      expect(environmentService.isQA()).toBe(false);
    });
  });

  // ============================================================================
  // clearCache Tests
  // ============================================================================

  describe('clearCache', () => {
    it('should clear all cached values', async () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'dev');
      mockSingle.mockResolvedValue({ data: mockDevEnvironment, error: null });
      mockOrder.mockResolvedValue({ data: [mockDevEnvironment], error: null });

      // Populate caches
      environmentService.getCurrentEnvironmentName();
      await environmentService.getCurrentEnvironment();
      await environmentService.getAvailableEnvironments();

      // Clear caches
      environmentService.clearCache();

      // Change environment
      vi.stubEnv('VITE_ENVIRONMENT', 'prod');
      mockSingle.mockResolvedValue({ data: mockProdEnvironment, error: null });

      // Should fetch fresh data
      const envName = environmentService.getCurrentEnvironmentName();
      expect(envName).toBe('prod');
    });
  });

  // ============================================================================
  // Convenience Function Tests
  // ============================================================================

  describe('convenience functions', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_ENVIRONMENT', 'dev');
      environmentService.clearCache();
    });

    it('getCurrentEnvironmentName should delegate to service', () => {
      expect(getCurrentEnvironmentName()).toBe('dev');
    });

    it('getCurrentEnvironment should delegate to service', async () => {
      mockSingle.mockResolvedValue({ data: mockDevEnvironment, error: null });

      const result = await getCurrentEnvironment();
      expect(result).toEqual(mockDevEnvironment);
    });

    it('getAvailableEnvironments should delegate to service', async () => {
      mockOrder.mockResolvedValue({ data: [mockDevEnvironment], error: null });

      const result = await getAvailableEnvironments();
      expect(result).toEqual([mockDevEnvironment]);
    });

    it('isProduction should delegate to service', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'prod');
      environmentService.clearCache();

      expect(isProduction()).toBe(true);
    });

    it('isDevelopment should delegate to service', () => {
      expect(isDevelopment()).toBe(true);
    });

    it('isQA should delegate to service', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'qa');
      environmentService.clearCache();

      expect(isQA()).toBe(true);
    });
  });
});
