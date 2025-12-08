import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, logger } from './logger';

describe('Logger', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in development mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true);
    });

    describe('debug()', () => {
      it('logs debug message in development', () => {
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
      it('logs info message in development', () => {
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
      it('logs warning message in development', () => {
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
      it('logs error message in development', () => {
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

  describe('in production mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
    });

    it('does not log debug messages in production', () => {
      const testLogger = new Logger();
      testLogger.debug('Should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('does not log info messages in production', () => {
      const testLogger = new Logger();
      testLogger.info('Should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('does not log warning messages in production', () => {
      const testLogger = new Logger();
      testLogger.warn('Should not log');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('still logs error messages in production', () => {
      const testLogger = new Logger();
      testLogger.error('Critical error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Critical error');
    });

    it('logs error context in production', () => {
      const testLogger = new Logger();
      const context = { error: 'Database connection failed' };
      testLogger.error('Database error', context);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy.mock.calls[1][0]).toBe('Context:');
      expect(consoleErrorSpy.mock.calls[1][1]).toEqual(context);
    });

    it('does not apply styling in production', () => {
      const testLogger = new Logger();
      testLogger.error('Production error');
      // In production, no styling (no %c)
      expect(consoleErrorSpy.mock.calls[0][0]).not.toContain('%c');
    });
  });

  describe('singleton instance', () => {
    it('exports a singleton logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('singleton works like a regular logger', () => {
      vi.stubEnv('DEV', true);
      logger.info('Test from singleton');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });
  });

  describe('console method selection', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true);
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
      vi.stubEnv('DEV', true);
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
  });
});
