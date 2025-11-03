import { TestLog } from '../types/testing';
import { logApi } from '@/shared/utils/apiLogger';

export class TestLogger {
  private logs: TestLog[] = [];
  private testId: string;

  constructor(testId: string) {
    this.testId = testId;
  }

  info(message: string, details?: any) {
    this.addLog('info', message, details);
  }

  warn(message: string, details?: any) {
    this.addLog('warn', message, details);
  }

  error(message: string, details?: any) {
    this.addLog('error', message, details);
  }

  debug(message: string, details?: any) {
    this.addLog('debug', message, details);
  }

  private addLog(level: TestLog['level'], message: string, details?: any) {
    const log: TestLog = {
      timestamp: Date.now(),
      level,
      message,
      details,
    };
    
    this.logs.push(log);
    
    // Send to server for persistence (best effort)
    if (level === 'error' || level === 'warn') {
      logApi({
        level,
        source: 'test_runner',
        endpoint: `/testing/${this.testId}`,
        message,
        details,
      }).catch(() => {
        // Ignore logging failures
      });
    }
  }

  getLogs(): TestLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}
