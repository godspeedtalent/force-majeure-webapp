import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@/test/utils/testUtils';
import { useAsyncOperation } from './useAsyncOperation';

describe('useAsyncOperation', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });
  });

  describe('execute - success', () => {
    it('should set isLoading to true during execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      let resolvePromise: (value: string) => void;
      const pendingPromise = new Promise<string>(resolve => {
        resolvePromise = resolve;
      });

      let executionPromise: Promise<string | null>;
      act(() => {
        executionPromise = result.current.execute(() => pendingPromise);
      });

      // Should be loading while promise is pending
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!('success');
        await executionPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set data on successful execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      await act(async () => {
        await result.current.execute(async () => 'test data');
      });

      expect(result.current.data).toBe('test data');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return the result on successful execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<number>());

      let returnedValue: number | null = null;
      await act(async () => {
        returnedValue = await result.current.execute(async () => 42);
      });

      expect(returnedValue).toBe(42);
    });

    it('should handle complex data types', async () => {
      interface User {
        id: string;
        name: string;
      }
      const { result } = renderHook(() => useAsyncOperation<User>());

      const testUser = { id: '1', name: 'Test User' };
      await act(async () => {
        await result.current.execute(async () => testUser);
      });

      expect(result.current.data).toEqual(testUser);
    });

    it('should clear previous error on new successful execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      // First: cause an error
      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('First error');
        });
      });
      expect(result.current.error).not.toBeNull();

      // Second: successful execution
      await act(async () => {
        await result.current.execute(async () => 'success');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });
  });

  describe('execute - error', () => {
    it('should set error on failed execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('Test error');
        });
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Test error');
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return null on failed execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      let returnedValue: string | null = 'initial';
      await act(async () => {
        returnedValue = await result.current.execute(async () => {
          throw new Error('Test error');
        });
      });

      expect(returnedValue).toBeNull();
    });

    it('should convert non-Error throws to Error', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw 'string error';
        });
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('should handle undefined throws', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw undefined;
        });
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should set isLoading to false even on error', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('Test error');
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should preserve previous data on error (for optimistic updates)', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      // First: successful execution
      await act(async () => {
        await result.current.execute(async () => 'success data');
      });
      expect(result.current.data).toBe('success data');

      // Second: failed execution - data should remain (useful for optimistic updates)
      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('Failed');
        });
      });

      // Data is preserved on error - useful for optimistic updates where
      // you want to show the last successful data while displaying an error
      expect(result.current.data).toBe('success data');
      expect(result.current.error?.message).toBe('Failed');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      // Set some state
      await act(async () => {
        await result.current.execute(async () => 'test data');
      });
      expect(result.current.data).toBe('test data');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('should reset error state', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>());

      // Cause an error
      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('Test error');
        });
      });
      expect(result.current.error).not.toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('concurrent operations', () => {
    it('should handle rapid successive calls', async () => {
      const { result } = renderHook(() => useAsyncOperation<number>());

      // Fire multiple executions rapidly
      await act(async () => {
        result.current.execute(async () => {
          await new Promise(r => setTimeout(r, 10));
          return 1;
        });
        result.current.execute(async () => {
          await new Promise(r => setTimeout(r, 5));
          return 2;
        });
        await result.current.execute(async () => {
          return 3;
        });
      });

      // Last one should win
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('callback stability', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() => useAsyncOperation<string>());

      const initialExecute = result.current.execute;
      const initialReset = result.current.reset;

      rerender();

      expect(result.current.execute).toBe(initialExecute);
      expect(result.current.reset).toBe(initialReset);
    });
  });

  describe('void operations', () => {
    it('should handle void return type', async () => {
      const { result } = renderHook(() => useAsyncOperation<void>());
      const mockFn = vi.fn();

      await act(async () => {
        await result.current.execute(async () => {
          mockFn();
        });
      });

      expect(mockFn).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
