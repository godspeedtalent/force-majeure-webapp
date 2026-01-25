import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { debugAccessService } from './debugAccessService';

describe('debugAccessService', () => {
  beforeEach(() => {
    // Reset state before each test
    debugAccessService.reset();
    // Clear the VITE_DEBUG_MODE env var
    vi.stubEnv('VITE_DEBUG_MODE', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ============================================================================
  // isLocalDeveloperMode Tests
  // ============================================================================

  describe('isLocalDeveloperMode', () => {
    it('should return false by default', () => {
      expect(debugAccessService.isLocalDeveloperMode()).toBe(false);
    });

    it('should return true when VITE_DEBUG_MODE is "true"', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      expect(debugAccessService.isLocalDeveloperMode()).toBe(true);
    });

    it('should return false for other values', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'false');
      expect(debugAccessService.isLocalDeveloperMode()).toBe(false);

      vi.stubEnv('VITE_DEBUG_MODE', '1');
      expect(debugAccessService.isLocalDeveloperMode()).toBe(false);

      vi.stubEnv('VITE_DEBUG_MODE', 'TRUE');
      expect(debugAccessService.isLocalDeveloperMode()).toBe(false);
    });
  });

  // ============================================================================
  // setDebugAccess Tests
  // ============================================================================

  describe('setDebugAccess', () => {
    it('should set debug access to true and mark auth as resolved', () => {
      debugAccessService.setDebugAccess(true);

      expect(debugAccessService.hasDebugAccess()).toBe(true);
      expect(debugAccessService.isAuthResolved()).toBe(true);
    });

    it('should set debug access to false and mark auth as resolved', () => {
      debugAccessService.setDebugAccess(false);

      expect(debugAccessService.hasDebugAccess()).toBe(false);
      expect(debugAccessService.isAuthResolved()).toBe(true);
    });

    it('should toggle debug access correctly', () => {
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });

  // ============================================================================
  // hasDebugAccess Tests
  // ============================================================================

  describe('hasDebugAccess', () => {
    it('should return true when local developer mode is enabled', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');

      // Even without setting access, should be true
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      // Even if explicitly set to false, local dev mode wins
      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(true);
    });

    it('should return false by default (no access, no local dev mode)', () => {
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });

    it('should return stored value when auth is resolved', () => {
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });
  });

  // ============================================================================
  // isAuthResolved Tests
  // ============================================================================

  describe('isAuthResolved', () => {
    it('should return false initially', () => {
      expect(debugAccessService.isAuthResolved()).toBe(false);
    });

    it('should return true after setDebugAccess is called', () => {
      debugAccessService.setDebugAccess(false);
      expect(debugAccessService.isAuthResolved()).toBe(true);

      debugAccessService.reset();

      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.isAuthResolved()).toBe(true);
    });

    it('should return false after clearDebugAccess', () => {
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.isAuthResolved()).toBe(true);

      debugAccessService.clearDebugAccess();
      expect(debugAccessService.isAuthResolved()).toBe(false);
    });
  });

  // ============================================================================
  // Log Buffering Tests
  // ============================================================================

  describe('log buffering', () => {
    it('should buffer logs when auth is not resolved', () => {
      const wasBuffered = debugAccessService.bufferLog('debug', 'Test message');
      expect(wasBuffered).toBe(true);
      expect(debugAccessService.getBufferSize()).toBe(1);
    });

    it('should not buffer logs when auth is resolved', () => {
      debugAccessService.setDebugAccess(false);

      const wasBuffered = debugAccessService.bufferLog('debug', 'Test message');
      expect(wasBuffered).toBe(false);
      expect(debugAccessService.getBufferSize()).toBe(0);
    });

    it('should not buffer logs when local developer mode is enabled', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');

      const wasBuffered = debugAccessService.bufferLog('debug', 'Test message');
      expect(wasBuffered).toBe(false);
      expect(debugAccessService.getBufferSize()).toBe(0);
    });

    it('should buffer multiple logs', () => {
      debugAccessService.bufferLog('debug', 'Message 1');
      debugAccessService.bufferLog('info', 'Message 2');
      debugAccessService.bufferLog('warn', 'Message 3');

      expect(debugAccessService.getBufferSize()).toBe(3);
    });

    it('should drop oldest logs when buffer is full', () => {
      // Buffer 100 logs (max size)
      for (let i = 0; i < 100; i++) {
        debugAccessService.bufferLog('debug', `Message ${i}`);
      }
      expect(debugAccessService.getBufferSize()).toBe(100);

      // Add one more - should still be 100 (oldest dropped)
      debugAccessService.bufferLog('debug', 'Message 100');
      expect(debugAccessService.getBufferSize()).toBe(100);
    });
  });

  // ============================================================================
  // flushBuffer Tests
  // ============================================================================

  describe('flushBuffer', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should discard buffered logs when user has no access', () => {
      debugAccessService.bufferLog('debug', 'Test message');
      expect(debugAccessService.getBufferSize()).toBe(1);

      // Resolve auth with no access
      debugAccessService.setDebugAccess(false);

      // Buffer should be cleared
      expect(debugAccessService.getBufferSize()).toBe(0);
      // Nothing should be logged (no header, no messages)
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should output buffered logs when user has access', () => {
      debugAccessService.bufferLog('debug', 'Test message');
      expect(debugAccessService.getBufferSize()).toBe(1);

      // Resolve auth with access
      debugAccessService.setDebugAccess(true);

      // Buffer should be cleared
      expect(debugAccessService.getBufferSize()).toBe(0);
      // Logs should be output (header + message)
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should output buffered logs in local developer mode', () => {
      // First buffer some logs
      debugAccessService.bufferLog('debug', 'Test message');

      // Then enable local dev mode
      vi.stubEnv('VITE_DEBUG_MODE', 'true');

      // Manually flush (normally triggered by setDebugAccess)
      debugAccessService.flushBuffer();

      // Buffer should be cleared
      expect(debugAccessService.getBufferSize()).toBe(0);
      // Logs should be output
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // clearDebugAccess Tests
  // ============================================================================

  describe('clearDebugAccess', () => {
    it('should reset debug access to false', () => {
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.hasDebugAccess()).toBe(true);

      debugAccessService.clearDebugAccess();
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });

    it('should reset auth resolved state', () => {
      debugAccessService.setDebugAccess(true);
      expect(debugAccessService.isAuthResolved()).toBe(true);

      debugAccessService.clearDebugAccess();
      expect(debugAccessService.isAuthResolved()).toBe(false);
    });

    it('should clear the log buffer', () => {
      debugAccessService.bufferLog('debug', 'Test message');
      expect(debugAccessService.getBufferSize()).toBe(1);

      debugAccessService.clearDebugAccess();
      expect(debugAccessService.getBufferSize()).toBe(0);
    });

    it('should be idempotent', () => {
      debugAccessService.clearDebugAccess();
      debugAccessService.clearDebugAccess();
      debugAccessService.clearDebugAccess();

      expect(debugAccessService.hasDebugAccess()).toBe(false);
      expect(debugAccessService.isAuthResolved()).toBe(false);
      expect(debugAccessService.getBufferSize()).toBe(0);
    });
  });

  // ============================================================================
  // Security Behavior Tests
  // ============================================================================

  describe('security behavior', () => {
    it('should default to no access (safe default)', () => {
      expect(debugAccessService.hasDebugAccess()).toBe(false);
    });

    it('should not leak access between sessions', () => {
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

    it('should not leak buffered logs between sessions', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Admin session buffers some logs (e.g., during page load)
      debugAccessService.bufferLog('debug', 'Admin debug info');

      // Admin logs out - buffer should be cleared
      debugAccessService.clearDebugAccess();
      expect(debugAccessService.getBufferSize()).toBe(0);

      // Non-admin user logs in
      debugAccessService.setDebugAccess(false);

      // No logs should be output for non-admin
      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  // ============================================================================
  // reset Tests
  // ============================================================================

  describe('reset', () => {
    it('should reset all state', () => {
      debugAccessService.setDebugAccess(true);
      debugAccessService.bufferLog('debug', 'Test');

      debugAccessService.reset();

      expect(debugAccessService.hasDebugAccess()).toBe(false);
      expect(debugAccessService.isAuthResolved()).toBe(false);
      expect(debugAccessService.getBufferSize()).toBe(0);
    });
  });
});
