import { useReducer, useCallback, useRef } from 'react';
import { logger } from '@force-majeure/shared/services/logger';
import {
  TestSuite,
  TestResult,
  TestRunOptions,
  ThreadInfo,
  TestExecutionStatus,
} from '../types/testing';
import { TestRunner } from '../services/TestRunner';

interface TestRunnerState {
  status: TestExecutionStatus;
  activeThreads: ThreadInfo[];
  results: TestResult[];
  error: string | null;
}

type TestRunnerAction =
  | { type: 'START' }
  | {
      type: 'PROGRESS';
      payload: { activeThreads: ThreadInfo[]; results: TestResult[] };
    }
  | { type: 'COMPLETE'; payload: { results: TestResult[] } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: TestRunnerState = {
  status: 'idle',
  activeThreads: [],
  results: [],
  error: null,
};

function testRunnerReducer(
  state: TestRunnerState,
  action: TestRunnerAction
): TestRunnerState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        status: 'running',
        activeThreads: [],
        results: [],
        error: null,
      };
    case 'PROGRESS':
      return {
        ...state,
        activeThreads: action.payload.activeThreads,
        results: action.payload.results,
      };
    case 'COMPLETE':
      return {
        ...state,
        status: 'completed',
        activeThreads: [],
        results: action.payload.results,
      };
    case 'PAUSE':
      return {
        ...state,
        status: 'paused',
      };
    case 'RESUME':
      return {
        ...state,
        status: 'running',
      };
    case 'STOP':
      return {
        ...state,
        status: 'stopped',
        activeThreads: [],
      };
    case 'ERROR':
      return {
        ...state,
        status: 'idle',
        error: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useTestRunner(options?: TestRunOptions) {
  const [state, dispatch] = useReducer(testRunnerReducer, initialState);
  const runnerRef = useRef<TestRunner | null>(null);

  const runSuite = useCallback(
    async (suite: TestSuite) => {
      try {
        dispatch({ type: 'START' });

        // Run beforeAll hook if it exists
        if (suite.beforeAll) {
          console.log('[TestRunner] Running beforeAll hook');
          await suite.beforeAll();
          console.log('[TestRunner] beforeAll hook completed');
        }

        // Create runner and execute tests
        runnerRef.current = new TestRunner(options);
        console.log('[TestRunner] Starting test execution', {
          testCount: suite.testCases.length,
          options,
        });

        const results = await runnerRef.current.runTests(
          suite.testCases,
          (activeThreads, results) => {
            dispatch({ type: 'PROGRESS', payload: { activeThreads, results } });
          }
        );

        console.log('[TestRunner] Test execution completed', {
          totalResults: results.length,
          passed: results.filter(r => r.status === 'passed').length,
          failed: results.filter(r => r.status === 'failed').length,
        });

        // Run afterAll hook if it exists
        if (suite.afterAll) {
          console.log('[TestRunner] Running afterAll hook');
          await suite.afterAll();
          console.log('[TestRunner] afterAll hook completed');
        }

        dispatch({ type: 'COMPLETE', payload: { results } });
      } catch (error) {
        logger.error('[TestRunner] Suite execution failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          source: 'useTestRunner.runSuite'
        });
        dispatch({ type: 'ERROR', payload: (error as Error).message });
      }
    },
    [options]
  );

  const pauseTests = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.pause();
      dispatch({ type: 'PAUSE' });
    }
  }, []);

  const resumeTests = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.resume();
      dispatch({ type: 'RESUME' });
    }
  }, []);

  const stopTests = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.stop();
      dispatch({ type: 'STOP' });
    }
  }, []);

  const resetTests = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    status: state.status,
    activeThreads: state.activeThreads,
    results: state.results,
    error: state.error,
    runSuite,
    pauseTests,
    resumeTests,
    stopTests,
    resetTests,
  };
}
