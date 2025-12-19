import { logApi } from '@/shared';
export class TestLogger {
    constructor(testId) {
        this.logs = [];
        this.testId = testId;
    }
    info(message, details) {
        this.addLog('info', message, details);
    }
    warn(message, details) {
        this.addLog('warn', message, details);
    }
    error(message, details) {
        this.addLog('error', message, details);
    }
    debug(message, details) {
        this.addLog('debug', message, details);
    }
    addLog(level, message, details) {
        const log = {
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
    getLogs() {
        return [...this.logs];
    }
    clear() {
        this.logs = [];
    }
}
