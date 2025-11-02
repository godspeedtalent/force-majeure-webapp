export type TestStatus = 'idle' | 'queued' | 'running' | 'passed' | 'failed' | 'skipped';

export type TestExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'stopped';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category?: string;
  timeout?: number;
  retries?: number;
  execute: () => Promise<void>;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: string;
  testCases: TestCase[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
}

export interface TestResult {
  testId: string;
  testName: string;
  status: TestStatus;
  executionTime: number;
  startTime: number;
  endTime: number;
  error?: {
    message: string;
    stack?: string;
  };
  logs: TestLog[];
  screenshot?: string;
  retryCount?: number;
}

export interface TestLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
}

export interface ThreadInfo {
  threadId: string;
  testId: string;
  testName: string;
  status: 'active' | 'completed';
  startTime: number;
  progress?: number;
}

export interface TestRunOptions {
  maxConcurrency?: number;
  timeout?: number;
  retries?: number;
  stopOnError?: boolean;
  onProgress?: (progress: TestRunProgress) => void;
}

export interface TestRunProgress {
  total: number;
  completed: number;
  passed: number;
  failed: number;
  running: number;
  queued: number;
  activeThreads: ThreadInfo[];
}

export interface TestEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'pause' | 'resume' | 'stop';
  timestamp: number;
  data?: any;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  successRate: number;
}
