import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { debugAccessService } from './debugAccessService';

describe('debugAccessService', () => {
  // Store original import.meta.env.DEV value
  const originalDEV = import.meta.env.DEV;

  beforeEach(() => {
    // Reset state before each test
    debugAccessService.clearDebugAccess();
  });

  afterEach(() => {
    // Restore original env
    vi.stubEnv('DEV', originalDEV);
  });

  // ============================================================================
  // setDebugAccess Tests
  // ============================================================================

  describe('setDebugAccess', () => {
    it('should set debug access to true', () => {
      // Stub DEV to false to test production behavior
      vi.stubEnv('DEV', false);

      debugAccessService.setDebugAccess(true);

      // In production mode, should return the set value
      expect(debugAccessService.hasDebugAccess()).toBe(true);
    });

    it('should set debug access to false', () => {
      vi.stubEnv('DEV', false);

      // First enable it
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      // Then disable it
      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });

  // ============================================================================
  // hasDebugAccess Tests
  // ============================================================================

  describe('hasDebugAccess', () => {
    it('should return true in development environment regardless of set value', () => {
      vi.stubEnv('DEV', true);

      // Even if not explicitly set, should be true in dev
      debugAccessService.clearDebugAccess();
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      // Even if explicitly set to false, dev always has access
      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(true);
    });

    it('should return false by default in production', () => {
      vi.stubEnv('DEV', false);

      debugAccessService.clearDebugAccess();
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });

    it('should return stored value in production', () => {
      vi.stubEnv('DEV', false);

      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });

  // ============================================================================
  // clearDebugAccess Tests
  // ============================================================================

  describe('clearDebugAccess', () => {
    it('should reset debug access to false', () => {
      vi.stubEnv('DEV', false);

      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      debugAccessService.clearDebugAccess();
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });

    it('should be idempotent (can be called multiple times)', () => {
      vi.stubEnv('DEV', false);

      debugAccessService.clearDebugAccess();
      debugAccessService.clearDebugAccess();
      debugAccessService.clearDebugAccess();

      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });

  // ============================================================================
  // Security Behavior Tests
  // ============================================================================

  describe('security behavior', () => {
    it('should default to no access (safe default)', () => {
      vi.stubEnv('DEV', false);

      // Fresh state should have no access
      debugAccessService.clearDebugAccess();
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });

    it('should not leak access between sessions (after clear)', () => {
      vi.stubEnv('DEV', false);

      // Simulate admin login
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      // Simulate logout
      debugAccessService.clearDebugAccess();
      expect(debugAccessService.hasDebugAccess()).toBe(false);

      // Simulate new session (non-admin)
      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should handle boolean coercion correctly', () => {
      vi.stubEnv('DEV', false);

      // TypeScript should enforce boolean, but test edge case
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });
});
