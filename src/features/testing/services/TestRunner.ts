import { TestCase, TestResult, TestRunOptions, ThreadInfo, TestExecutionStatus } from '../types/testing';
import { TestLogger } from './TestLogger';

export class TestRunner {
  private maxConcurrency: number;
  private timeout: number;
  private retries: number;
  private stopOnError: boolean;
  private activeThreads: Map<string, ThreadInfo> = new Map();
  private results: TestResult[] = [];
  private queue: TestCase[] = [];
  private status: TestExecutionStatus = 'idle';
  private abortController?: AbortController;

  constructor(options: TestRunOptions = {}) {
    this.maxConcurrency = options.maxConcurrency || 3;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 0;
    this.stopOnError = options.stopOnError || false;
  }

  async runTests(
    testCases: TestCase[],
    onProgress?: (activeThreads: ThreadInfo[], results: TestResult[]) => void
  ): Promise<TestResult[]> {
    this.status = 'running';
    this.results = [];
    this.queue = [...testCases];
    this.abortController = new AbortController();

    const executing: Promise<void>[] = [];

    while (this.queue.length > 0 || executing.length > 0) {
      const currentStatus = this.getStatus();
      
      // Check if stopped
      if (currentStatus === 'stopped') {
        break;
      }

      // Wait while paused
      while (this.getStatus() === 'paused') {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.getStatus() === 'stopped') {
          break;
        }
      }

      // Check again after potentially being paused
      if (this.getStatus() === 'stopped') {
        break;
      }

      // Start new tests up to max concurrency
      while (this.queue.length > 0 && executing.length < this.maxConcurrency && this.getStatus() === 'running') {
        const testCase = this.queue.shift()!;
        const promise = this.executeTest(testCase, onProgress).then(() => {
          const index = executing.indexOf(promise);
          if (index > -1) {
            executing.splice(index, 1);
          }
        });
        executing.push(promise);
      }

      // Wait for at least one test to complete
      if (executing.length > 0) {
        await Promise.race(executing);
      }

      // Check if we should stop on error
      if (this.stopOnError && this.results.some(r => r.status === 'failed')) {
        this.status = 'stopped';
        break;
      }
    }

    // Wait for all remaining tests
    await Promise.all(executing);

    if (this.getStatus() !== 'stopped') {
      this.status = 'completed';
    }
    return this.results;
  }

  private async executeTest(
    testCase: TestCase,
    onProgress?: (activeThreads: ThreadInfo[], results: TestResult[]) => void
  ): Promise<void> {
    const threadId = `thread-${Date.now()}-${Math.random()}`;
    const logger = new TestLogger(testCase.id);
    const startTime = Date.now();

    const threadInfo: ThreadInfo = {
      threadId,
      testId: testCase.id,
      testName: testCase.name,
      status: 'active',
      startTime,
    };

    this.activeThreads.set(threadId, threadInfo);
    onProgress?.(Array.from(this.activeThreads.values()), this.results);

    let retryCount = 0;
    let lastError: Error | undefined;

    while (retryCount <= (testCase.retries || this.retries)) {
      try {
        logger.info(`Starting test: ${testCase.name} (attempt ${retryCount + 1})`);

        // Execute with timeout
        await Promise.race([
          testCase.execute(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), testCase.timeout || this.timeout)
          ),
        ]);

        const endTime = Date.now();
        const result: TestResult = {
          testId: testCase.id,
          testName: testCase.name,
          status: 'passed',
          executionTime: endTime - startTime,
          startTime,
          endTime,
          logs: logger.getLogs(),
          retryCount,
        };

        this.results.push(result);
        logger.info(`Test passed: ${testCase.name}`);
        break;
      } catch (error) {
        lastError = error as Error;
        logger.error(`Test failed: ${testCase.name}`, { error: lastError.message });
        retryCount++;

        if (retryCount > (testCase.retries || this.retries)) {
          const endTime = Date.now();
          const result: TestResult = {
            testId: testCase.id,
            testName: testCase.name,
            status: 'failed',
            executionTime: endTime - startTime,
            startTime,
            endTime,
            error: {
              message: lastError.message,
              stack: lastError.stack,
            },
            logs: logger.getLogs(),
            retryCount: retryCount - 1,
          };

          this.results.push(result);
        }
      }
    }

    threadInfo.status = 'completed';
    this.activeThreads.delete(threadId);
    onProgress?.(Array.from(this.activeThreads.values()), this.results);
  }

  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  stop() {
    this.status = 'stopped';
    this.abortController?.abort();
  }

  getStatus(): TestExecutionStatus {
    return this.status;
  }

  getActiveThreads(): ThreadInfo[] {
    return Array.from(this.activeThreads.values());
  }

  getResults(): TestResult[] {
    return [...this.results];
  }
}
