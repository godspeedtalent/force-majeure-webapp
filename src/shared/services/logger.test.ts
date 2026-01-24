import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, logger } from './logger';
import { debugAccessService } from './debugAccessService';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset debug access service state
    debugAccessService.reset();
    // Clear the VITE_DEBUG_MODE env var
    vi.stubEnv('VITE_DEBUG_MODE', '');

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('with debug access (local developer mode)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
    });

    describe('debug()', () => {
      it('logs debug message when user has access', () => {
        const testLogger = new Logger();
        testLogger.debug('Test debug message');
        expect(consoleLogSpy).toHaveBeenCalled();
        expect(consoleLogSpy.mock.calls[0][0]).toContain('DEBUG');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('Test debug message');
      });

      it('includes emoji in debug message', () => {
        const testLogger = new Logger();
        testLogger.debug('Test');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('🔍');
      });

      it('logs context object when provided', () => {
        const testLogger = new Logger();
        const context = { userId: 123, action: 'login' };
        testLogger.debug('User action', context);
        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy.mock.calls[1][0]).toBe('Context:');
        expect(consoleLogSpy.mock.calls[1][1]).toEqual(context);
      });
    });

    describe('info()', () => {
      it('logs info message when user has access', () => {
        const testLogger = new Logger();
        testLogger.info('Test info message');
        expect(consoleLogSpy).toHaveBeenCalled();
        expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('Test info message');
      });

      it('includes emoji in info message', () => {
        const testLogger = new Logger();
        testLogger.info('Test');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('ℹ️');
      });
    });

    describe('warn()', () => {
      it('logs warning message when user has access', () => {
        const testLogger = new Logger();
        testLogger.warn('Test warning');
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('Test warning');
      });

      it('includes emoji in warning message', () => {
        const testLogger = new Logger();
        testLogger.warn('Test');
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('⚠️');
      });
    });

    describe('error()', () => {
      it('logs error message when user has access', () => {
        const testLogger = new Logger();
        testLogger.error('Test error');
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('Test error');
      });

      it('includes emoji in error message', () => {
        const testLogger = new Logger();
        testLogger.error('Test');
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('❌');
      });
    });

    describe('with namespace', () => {
      it('includes namespace in log message', () => {
        const testLogger = new Logger('Auth');
        testLogger.info('Test message');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('[Auth]');
      });

      it('createNamespace creates new logger with namespace', () => {
        const testLogger = new Logger();
        const namespacedLogger = testLogger.createNamespace('Database');
        namespacedLogger.info('Test message');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('[Database]');
      });

      it('ns() is alias for createNamespace()', () => {
        const testLogger = new Logger();
        const namespacedLogger = testLogger.ns('API');
        namespacedLogger.info('Test message');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('[API]');
      });
    });

    describe('styling', () => {
      it('applies color styling to debug messages', () => {
        const testLogger = new Logger();
        testLogger.debug('Test');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('%c');
        expect(consoleLogSpy.mock.calls[0][1]).toContain('color');
      });

      it('applies color styling to info messages', () => {
        const testLogger = new Logger();
        testLogger.info('Test');
        expect(consoleLogSpy.mock.calls[0][0]).toContain('%c');
        expect(consoleLogSpy.mock.calls[0][1]).toContain('color');
      });

      it('applies color styling to warning messages', () => {
        const testLogger = new Logger();
        testLogger.warn('Test');
        expect(consoleWarnSpy.mock.calls[0][0]).toContain('%c');
        expect(consoleWarnSpy.mock.calls[0][1]).toContain('color');
      });

      it('applies color styling to error messages', () => {
        const testLogger = new Logger();
        testLogger.error('Test');
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('%c');
        expect(consoleErrorSpy.mock.calls[0][1]).toContain('color');
      });
    });
  });

  describe('with debug access (role-based)', () => {
    beforeEach(() => {
      // Simulate user with admin/developer role
      debugAccessService.setDebugAccess(true);
    });

    it('logs debug messages for admin/developer users', () => {
      const testLogger = new Logger();
      testLogger.debug('Admin debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('DEBUG');
    });

    it('logs info messages for admin/developer users', () => {
      const testLogger = new Logger();
      testLogger.info('Admin info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });

    it('logs warning messages for admin/developer users', () => {
      const testLogger = new Logger();
      testLogger.warn('Admin warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
    });
  });

  describe('without debug access (regular user, auth resolved)', () => {
    beforeEach(() => {
      // Simulate regular user (no admin/developer role)
      debugAccessService.setDebugAccess(false);
    });

    it('does not log debug messages for regular users', () => {
      const testLogger = new Logger();
      testLogger.debug('Should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('does not log info messages for regular users', () => {
      const testLogger = new Logger();
      testLogger.info('Should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('does not log warning messages for regular users', () => {
      const testLogger = new Logger();
      testLogger.warn('Should not log');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('still logs error messages for regular users', () => {
      const testLogger = new Logger();
      testLogger.error('Critical error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Critical error');
    });

    it('logs error context for regular users', () => {
      const testLogger = new Logger();
      const context = { error: 'Database connection failed' };
      testLogger.error('Database error', context);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy.mock.calls[1][0]).toBe('Context:');
      expect(consoleErrorSpy.mock.calls[1][1]).toEqual(context);
    });

    it('does not apply styling for errors when no debug access', () => {
      const testLogger = new Logger();
      testLogger.error('Production error');
      // In production, no styling (no %c)
      expect(consoleErrorSpy.mock.calls[0][0]).not.toContain('%c');
    });
  });

  describe('pre-auth buffering (auth not yet resolved)', () => {
    // Auth not resolved - logs should be buffered, not output

    it('buffers debug messages before auth resolves', () => {
      const testLogger = new Logger();
      testLogger.debug('Pre-auth debug');

      // Nothing logged immediately
      expect(consoleLogSpy).not.toHaveBeenCalled();
      // But buffered
      expect(debugAccessService.getBufferSize()).toBe(1);
    });

    it('buffers info messages before auth resolves', () => {
      const testLogger = new Logger();
      testLogger.info('Pre-auth info');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(1);
    });

    it('buffers warn messages before auth resolves', () => {
      const testLogger = new Logger();
      testLogger.warn('Pre-auth warning');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(1);
    });

    it('does NOT buffer error messages - they always log immediately', () => {
      const testLogger = new Logger();
      testLogger.error('Pre-auth error');

      // Errors are never buffered, always logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(0);
    });

    it('flushes buffered logs when admin/developer logs in', () => {
      const testLogger = new Logger();
      testLogger.debug('Pre-auth debug');
      testLogger.info('Pre-auth info');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(2);

      // Admin logs in - triggers flush
      debugAccessService.setDebugAccess(true);

      // Buffered logs should now be output
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(0);
    });

    it('discards buffered logs when regular user logs in', () => {
      const testLogger = new Logger();
      testLogger.debug('Pre-auth debug');
      testLogger.info('Pre-auth info');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(2);

      // Regular user logs in - triggers discard
      debugAccessService.setDebugAccess(false);

      // Buffer should be cleared but nothing logged
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(debugAccessService.getBufferSize()).toBe(0);
    });

    it('buffers logs with namespace information', () => {
      const testLogger = new Logger('Auth');
      testLogger.debug('Pre-auth debug');

      expect(debugAccessService.getBufferSize()).toBe(1);

      // When flushed by admin, namespace should be included
      debugAccessService.setDebugAccess(true);
      expect(consoleLogSpy).toHaveBeenCalled();
      // Check that namespace is in the output
      const logOutput = consoleLogSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('Auth')
      );
      expect(logOutput).toBeDefined();
    });
  });

  describe('singleton instance', () => {
    it('exports a singleton logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('singleton works with local developer mode', () => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
      logger.info('Test from singleton');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });

    it('singleton works with role-based access', () => {
      debugAccessService.setDebugAccess(true);
      logger.info('Test from singleton');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });
  });

  describe('console method selection', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
    });

    it('uses console.log for DEBUG', () => {
      const testLogger = new Logger();
      testLogger.debug('Test');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('uses console.log for INFO', () => {
      const testLogger = new Logger();
      testLogger.info('Test');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('uses console.warn for WARN', () => {
      const testLogger = new Logger();
      testLogger.warn('Test');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('uses console.error for ERROR', () => {
      const testLogger = new Logger();
      testLogger.error('Test');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_DEBUG_MODE', 'true');
    });

    it('handles empty message', () => {
      const testLogger = new Logger();
      testLogger.info('');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('handles undefined context', () => {
      const testLogger = new Logger();
      testLogger.info('Test', undefined);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // Only message, no context
    });

    it('handles empty context object', () => {
      const testLogger = new Logger();
      testLogger.info('Test', {});
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy.mock.calls[1][1]).toEqual({});
    });

    it('handles special characters in message', () => {
      const testLogger = new Logger();
      testLogger.info('Test with <script>alert("XSS")</script>');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('<script>');
    });

    it('handles complex nested context objects', () => {
      const testLogger = new Logger();
      const context = {
        user: { id: 1, name: 'Test' },
        nested: { deep: { value: 'test' } },
      };
      testLogger.info('Complex context', context);
      expect(consoleLogSpy.mock.calls[1][1]).toEqual(context);
    });

    it('handles Error objects in context', () => {
      const testLogger = new Logger();
      const error = new Error('Test error');
      testLogger.error('Error occurred', { error });
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Error should be serialized - context is logged via console.log when debug access is available
      // consoleLogSpy call 0 is "Context:", context
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][0]).toBe('Context:');
      const contextArg = consoleLogSpy.mock.calls[0][1] as { error: { message: string; name: string } };
      expect(contextArg.error).toHaveProperty('message', 'Test error');
      expect(contextArg.error).toHaveProperty('name', 'Error');
    });
  });
});
