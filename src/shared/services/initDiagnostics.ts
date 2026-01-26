/**
 * Initialization Diagnostics Service
 *
 * Collects timing and status information during app initialization
 * and provides a single formatted diagnostic report for debugging.
 *
 * Usage: Call `window.__fmDiagnostics()` in browser console to get report
 */

export interface DiagnosticEvent {
  name: string;
  timestamp: number;
  elapsed: number; // ms since init start
  status: 'start' | 'complete' | 'error' | 'warning' | 'info';
  details?: Record<string, unknown>;
}

export interface DiagnosticError {
  message: string;
  timestamp: number;
}

export interface DiagnosticState {
  initStart: number;
  events: DiagnosticEvent[];
  errors: DiagnosticError[];
  warnings: DiagnosticError[];
  pendingOperations: Map<string, number>; // operation name -> start time
}

// Serializable version of state (for React)
export interface DiagnosticSnapshot {
  initStart: number;
  totalElapsed: number;
  events: DiagnosticEvent[];
  errors: DiagnosticError[];
  warnings: DiagnosticError[];
  pendingOperations: Array<{ name: string; startTime: number; waitingMs: number }>;
  status: 'healthy' | 'warning' | 'error' | 'incomplete';
  // Health monitor state
  healthMonitor: {
    isRunning: boolean;
    intervalMs: number;
    lastCheckTime: number | null;
    lastCheckResult: 'healthy' | 'issues' | null;
  };
}

class InitDiagnostics {
  private state: DiagnosticState = {
    initStart: performance.now(),
    events: [],
    errors: [],
    warnings: [],
    pendingOperations: new Map(),
  };

  // Health monitor state
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private healthCheckIntervalMs = 60000;
  private lastHealthCheckErrors = 0;
  private lastHealthCheckWarnings = 0;
  private lastHealthCheckTime: number | null = null;
  private lastHealthCheckResult: 'healthy' | 'issues' | null = null;

  // Subscription state for React integration
  private subscribers: Set<() => void> = new Set();

  // Snapshot caching for useSyncExternalStore compatibility
  // Without caching, getSnapshot returns new objects every call,
  // which causes infinite re-render loops in React
  private cachedSnapshot: DiagnosticSnapshot | null = null;
  private snapshotVersion = 0;

  private expectedFlow = [
    'imports.start',
    'supabase.imported',
    'i18n.init.start',
    'i18n.imported',
    'app.imported',
    'react.root.created',
    'react.render.called',
    'app.rendering',
    'auth.provider.mounted',
    'auth.bootstrap.start',
    'auth.getSession.start',
    'auth.getSession.complete',
    'auth.bootstrap.complete',
    'i18n.init.complete',
    'routes.rendering',
  ];

  constructor() {
    // Expose globally for console access
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__fmDiagnostics = () => this.getReport();
      (window as unknown as Record<string, unknown>).__fmDiagnosticsRaw = () => this.state;
    }
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers() {
    // Invalidate cached snapshot so next getSnapshot() creates a new one
    this.snapshotVersion++;
    this.cachedSnapshot = null;
    this.subscribers.forEach(callback => callback());
  }

  /**
   * Subscribe to state changes (for React integration)
   * @returns Unsubscribe function
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get a serializable snapshot of current state (for React)
   * This is cached to prevent infinite re-render loops with useSyncExternalStore.
   * The cache is invalidated when notifySubscribers() is called.
   */
  getSnapshot(): DiagnosticSnapshot {
    // Return cached snapshot if available (critical for useSyncExternalStore)
    if (this.cachedSnapshot !== null) {
      return this.cachedSnapshot;
    }

    const now = performance.now();
    const pending = Array.from(this.state.pendingOperations.entries()).map(([name, startTime]) => ({
      name,
      startTime,
      waitingMs: now - startTime,
    }));

    let status: DiagnosticSnapshot['status'] = 'healthy';
    if (this.state.errors.length > 0) {
      status = 'error';
    } else if (pending.length > 0) {
      status = 'incomplete';
    } else if (this.state.warnings.length > 0) {
      status = 'warning';
    }

    // Cache the snapshot
    this.cachedSnapshot = {
      initStart: this.state.initStart,
      totalElapsed: now - this.state.initStart,
      events: [...this.state.events],
      errors: [...this.state.errors],
      warnings: [...this.state.warnings],
      pendingOperations: pending,
      status,
      healthMonitor: {
        isRunning: this.healthCheckInterval !== null,
        intervalMs: this.healthCheckIntervalMs,
        lastCheckTime: this.lastHealthCheckTime,
        lastCheckResult: this.lastHealthCheckResult,
      },
    };

    return this.cachedSnapshot;
  }

  /**
   * Record the start of an operation
   */
  start(name: string, details?: Record<string, unknown>) {
    const timestamp = performance.now();
    const elapsed = timestamp - this.state.initStart;

    this.state.pendingOperations.set(name, timestamp);
    this.state.events.push({
      name,
      timestamp,
      elapsed,
      status: 'start',
      details,
    });

    // Also log to console for real-time visibility
    console.log(`[DIAG] ▶ ${name} (${elapsed.toFixed(0)}ms)`);
    this.notifySubscribers();
  }

  /**
   * Record the completion of an operation
   */
  complete(name: string, details?: Record<string, unknown>) {
    const timestamp = performance.now();
    const elapsed = timestamp - this.state.initStart;
    const startTime = this.state.pendingOperations.get(name);
    const duration = startTime ? timestamp - startTime : undefined;

    this.state.pendingOperations.delete(name);
    this.state.events.push({
      name,
      timestamp,
      elapsed,
      status: 'complete',
      details: { ...details, duration },
    });

    const durationStr = duration ? ` (took ${duration.toFixed(0)}ms)` : '';
    console.log(`[DIAG] ✓ ${name}${durationStr} (${elapsed.toFixed(0)}ms total)`);
    this.notifySubscribers();
  }

  /**
   * Record an error
   */
  error(name: string, error: unknown, details?: Record<string, unknown>) {
    const timestamp = performance.now();
    const elapsed = timestamp - this.state.initStart;
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.state.pendingOperations.delete(name);
    this.state.errors.push({ message: `${name}: ${errorMessage}`, timestamp });
    this.state.events.push({
      name,
      timestamp,
      elapsed,
      status: 'error',
      details: { ...details, error: errorMessage },
    });

    console.error(`[DIAG] ✗ ${name}: ${errorMessage} (${elapsed.toFixed(0)}ms)`);
    this.notifySubscribers();
  }

  /**
   * Record a warning
   */
  warn(name: string, message: string, details?: Record<string, unknown>) {
    const timestamp = performance.now();
    const elapsed = timestamp - this.state.initStart;

    this.state.warnings.push({ message: `${name}: ${message}`, timestamp });
    this.state.events.push({
      name,
      timestamp,
      elapsed,
      status: 'warning',
      details: { ...details, message },
    });

    console.warn(`[DIAG] ⚠ ${name}: ${message} (${elapsed.toFixed(0)}ms)`);
    this.notifySubscribers();
  }

  /**
   * Record an info event (no start/complete tracking)
   */
  info(name: string, details?: Record<string, unknown>) {
    const timestamp = performance.now();
    const elapsed = timestamp - this.state.initStart;

    this.state.events.push({
      name,
      timestamp,
      elapsed,
      status: 'info',
      details,
    });

    console.log(`[DIAG] ℹ ${name} (${elapsed.toFixed(0)}ms)`);
    this.notifySubscribers();
  }

  /**
   * Get a formatted diagnostic report
   */
  getReport(): string {
    const now = performance.now();
    const totalElapsed = now - this.state.initStart;
    const pending = Array.from(this.state.pendingOperations.entries());

    // Analyze the flow
    const completedOps = this.state.events
      .filter(e => e.status === 'complete')
      .map(e => e.name);

    const missingOps = this.expectedFlow.filter(op => {
      const baseName = op.replace('.start', '').replace('.complete', '');
      return !completedOps.some(c => c.includes(baseName));
    });

    // Find slow operations (> 1000ms)
    const slowOps = this.state.events
      .filter(e => e.status === 'complete' && e.details?.duration && (e.details.duration as number) > 1000)
      .map(e => ({ name: e.name, duration: e.details?.duration as number }));

    // Build report
    const lines: string[] = [
      '=== FM INITIALIZATION DIAGNOSTICS ===',
      `Generated: ${new Date().toISOString()}`,
      `Total time: ${totalElapsed.toFixed(0)}ms`,
      '',
    ];

    // Status summary
    if (this.state.errors.length > 0) {
      lines.push('❌ STATUS: ERRORS DETECTED');
    } else if (pending.length > 0) {
      lines.push('⏳ STATUS: INITIALIZATION INCOMPLETE');
    } else if (this.state.warnings.length > 0) {
      lines.push('⚠️ STATUS: COMPLETED WITH WARNINGS');
    } else {
      lines.push('✅ STATUS: HEALTHY');
    }
    lines.push('');

    // Errors
    if (this.state.errors.length > 0) {
      lines.push('ERRORS:');
      this.state.errors.forEach(e => {
        lines.push(`  • ${e.message}`);
      });
      lines.push('');
    }

    // Warnings
    if (this.state.warnings.length > 0) {
      lines.push('WARNINGS:');
      this.state.warnings.forEach(w => {
        lines.push(`  • ${w.message}`);
      });
      lines.push('');
    }

    // Pending operations (likely cause of hang)
    if (pending.length > 0) {
      lines.push('⚠️ PENDING OPERATIONS (likely cause of hang):');
      pending.forEach(([name, startTime]) => {
        const waitingFor = now - startTime;
        lines.push(`  • ${name} - waiting ${waitingFor.toFixed(0)}ms`);
      });
      lines.push('');
    }

    // Slow operations
    if (slowOps.length > 0) {
      lines.push('SLOW OPERATIONS (>1s):');
      slowOps.forEach(op => {
        lines.push(`  • ${op.name}: ${op.duration.toFixed(0)}ms`);
      });
      lines.push('');
    }

    // Timeline
    lines.push('INITIALIZATION TIMELINE:');
    this.state.events.forEach(e => {
      const symbol = {
        start: '▶',
        complete: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ',
      }[e.status];
      const duration = e.details?.duration ? ` (${(e.details.duration as number).toFixed(0)}ms)` : '';
      lines.push(`  ${e.elapsed.toFixed(0).padStart(5)}ms ${symbol} ${e.name}${duration}`);
    });
    lines.push('');

    // Missing expected operations
    if (missingOps.length > 0) {
      lines.push('MISSING EXPECTED OPERATIONS:');
      missingOps.forEach(op => {
        lines.push(`  • ${op}`);
      });
      lines.push('');
    }

    // Key metrics
    lines.push('KEY METRICS:');
    const authGetSession = this.state.events.find(e => e.name === 'auth.getSession' && e.status === 'complete');
    const i18nInit = this.state.events.find(e => e.name === 'i18n.init' && e.status === 'complete');
    const authBootstrap = this.state.events.find(e => e.name === 'auth.bootstrap' && e.status === 'complete');

    lines.push(`  • Auth getSession: ${authGetSession?.details?.duration ? `${(authGetSession.details.duration as number).toFixed(0)}ms` : 'NOT COMPLETED'}`);
    lines.push(`  • i18n init: ${i18nInit?.details?.duration ? `${(i18nInit.details.duration as number).toFixed(0)}ms` : 'NOT COMPLETED'}`);
    lines.push(`  • Auth bootstrap: ${authBootstrap?.details?.duration ? `${(authBootstrap.details.duration as number).toFixed(0)}ms` : 'NOT COMPLETED'}`);
    lines.push('');

    lines.push('=== END DIAGNOSTICS ===');
    lines.push('');
    lines.push('To copy: Select all text above and paste into support chat.');

    const report = lines.join('\n');

    // Also log to console
    console.log(report);

    return report;
  }

  /**
   * Start periodic health monitoring
   * Only outputs to console when issues are detected
   * @param intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
   */
  startHealthMonitor(intervalMs = 60000) {
    if (this.healthCheckInterval) {
      console.log('[DIAG] Health monitor already running');
      return;
    }

    this.healthCheckIntervalMs = intervalMs;
    this.healthCheckInterval = setInterval(() => {
      this.runHealthCheck();
    }, intervalMs);

    console.log(`[DIAG] Health monitor started (every ${intervalMs / 1000}s)`);
    this.notifySubscribers();
  }

  /**
   * Run a health check - logs if issues are found and updates UI state
   */
  private runHealthCheck() {
    const now = performance.now();
    const newErrors = this.state.errors.length - this.lastHealthCheckErrors;
    const newWarnings = this.state.warnings.length - this.lastHealthCheckWarnings;
    const pending = Array.from(this.state.pendingOperations.entries());

    // Track health check time
    this.lastHealthCheckTime = Date.now();

    // Determine result
    const hasIssues = newErrors > 0 || newWarnings > 0 || pending.length > 0;
    this.lastHealthCheckResult = hasIssues ? 'issues' : 'healthy';

    // Only output to console if there are NEW issues since last check
    if (hasIssues) {
      const lines: string[] = [
        `[FM HEALTH] ${new Date().toISOString()}`,
      ];

      if (newErrors > 0) {
        lines.push(`❌ ${newErrors} new error(s):`);
        this.state.errors.slice(-newErrors).forEach(e => {
          lines.push(`   • ${e.message}`);
        });
      }

      if (newWarnings > 0) {
        lines.push(`⚠️ ${newWarnings} new warning(s):`);
        this.state.warnings.slice(-newWarnings).forEach(w => {
          lines.push(`   • ${w.message}`);
        });
      }

      if (pending.length > 0) {
        lines.push(`⏳ ${pending.length} stuck operation(s):`);
        pending.forEach(([name, startTime]) => {
          const waitingFor = now - startTime;
          lines.push(`   • ${name} (${(waitingFor / 1000).toFixed(1)}s)`);
        });
      }

      lines.push('');
      lines.push('Run window.__fmDiagnostics() for full report');

      console.warn(lines.join('\n'));
    }

    // Update counters for next check
    this.lastHealthCheckErrors = this.state.errors.length;
    this.lastHealthCheckWarnings = this.state.warnings.length;

    // Notify React subscribers to update UI
    this.notifySubscribers();
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitor() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[DIAG] Health monitor stopped');
      this.notifySubscribers();
    }
  }

  /**
   * Check if health monitor is running
   */
  isHealthMonitorRunning(): boolean {
    return this.healthCheckInterval !== null;
  }

  /**
   * Reset diagnostics (for testing)
   */
  reset() {
    this.stopHealthMonitor();
    this.state = {
      initStart: performance.now(),
      events: [],
      errors: [],
      warnings: [],
      pendingOperations: new Map(),
    };
    this.lastHealthCheckErrors = 0;
    this.lastHealthCheckWarnings = 0;
    this.notifySubscribers();
  }
}

// Singleton instance
export const initDiagnostics = new InitDiagnostics();

// Convenience functions
export const diagStart = (name: string, details?: Record<string, unknown>) =>
  initDiagnostics.start(name, details);
export const diagComplete = (name: string, details?: Record<string, unknown>) =>
  initDiagnostics.complete(name, details);
export const diagError = (name: string, error: unknown, details?: Record<string, unknown>) =>
  initDiagnostics.error(name, error, details);
export const diagWarn = (name: string, message: string, details?: Record<string, unknown>) =>
  initDiagnostics.warn(name, message, details);
export const diagInfo = (name: string, details?: Record<string, unknown>) =>
  initDiagnostics.info(name, details);