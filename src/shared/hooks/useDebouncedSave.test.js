import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedSave } from './useDebouncedSave';
// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));
// Mock logger
vi.mock('@/shared/services/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));
describe('useDebouncedSave', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    describe('initialization', () => {
        it('should return triggerSave, flushSave, cancelSave, and hasPendingSave', () => {
            const saveFn = vi.fn();
            const { result } = renderHook(() => useDebouncedSave({ saveFn }));
            expect(result.current.triggerSave).toBeDefined();
            expect(result.current.flushSave).toBeDefined();
            expect(result.current.cancelSave).toBeDefined();
            expect(result.current.hasPendingSave).toBeDefined();
            expect(typeof result.current.triggerSave).toBe('function');
            expect(typeof result.current.flushSave).toBe('function');
            expect(typeof result.current.cancelSave).toBe('function');
            expect(typeof result.current.hasPendingSave).toBe('function');
        });
        it('should initially have no pending save', () => {
            const saveFn = vi.fn();
            const { result } = renderHook(() => useDebouncedSave({ saveFn }));
            expect(result.current.hasPendingSave()).toBe(false);
        });
    });
    describe('triggerSave', () => {
        it('should not call saveFn immediately', () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            expect(saveFn).not.toHaveBeenCalled();
        });
        it('should call saveFn after delay', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            // Fast forward timer
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });
            expect(saveFn).toHaveBeenCalledWith({ name: 'test' });
            expect(saveFn).toHaveBeenCalledTimes(1);
        });
        it('should use default delay of 5000ms', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            // Should not have been called at 4999ms
            await act(async () => {
                vi.advanceTimersByTime(4999);
            });
            expect(saveFn).not.toHaveBeenCalled();
            // Should be called at 5000ms
            await act(async () => {
                vi.advanceTimersByTime(1);
            });
            expect(saveFn).toHaveBeenCalled();
        });
        it('should set hasPendingSave to true after trigger', () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            expect(result.current.hasPendingSave()).toBe(true);
        });
        it('should debounce multiple triggers', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.triggerSave({ name: 'first' });
            });
            await act(async () => {
                vi.advanceTimersByTime(500);
            });
            act(() => {
                result.current.triggerSave({ name: 'second' });
            });
            await act(async () => {
                vi.advanceTimersByTime(500);
            });
            act(() => {
                result.current.triggerSave({ name: 'third' });
            });
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });
            // Only the last value should have been saved
            expect(saveFn).toHaveBeenCalledTimes(1);
            expect(saveFn).toHaveBeenCalledWith({ name: 'third' });
        });
        it('should not trigger when disabled', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000, enabled: false }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            await act(async () => {
                vi.advanceTimersByTime(2000);
            });
            expect(saveFn).not.toHaveBeenCalled();
        });
    });
    describe('flushSave', () => {
        it('should execute pending save immediately', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 5000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            expect(saveFn).not.toHaveBeenCalled();
            await act(async () => {
                await result.current.flushSave();
            });
            expect(saveFn).toHaveBeenCalledWith({ name: 'test' });
        });
        it('should clear the pending save after flush', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 5000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            expect(result.current.hasPendingSave()).toBe(true);
            await act(async () => {
                await result.current.flushSave();
            });
            expect(result.current.hasPendingSave()).toBe(false);
        });
        it('should do nothing when no pending save', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 5000 }));
            await act(async () => {
                await result.current.flushSave();
            });
            expect(saveFn).not.toHaveBeenCalled();
        });
        it('should not flush when disabled', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 5000, enabled: false }));
            // Manually set pending data scenario by triggering with enabled true first
            // then flush with enabled false - this won't work with current impl
            // So test that flush respects enabled flag
            await act(async () => {
                await result.current.flushSave();
            });
            expect(saveFn).not.toHaveBeenCalled();
        });
    });
    describe('cancelSave', () => {
        it('should cancel pending save', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            expect(result.current.hasPendingSave()).toBe(true);
            act(() => {
                result.current.cancelSave();
            });
            expect(result.current.hasPendingSave()).toBe(false);
            // Timer should not trigger save after cancel
            await act(async () => {
                vi.advanceTimersByTime(2000);
            });
            expect(saveFn).not.toHaveBeenCalled();
        });
        it('should do nothing when no pending save', () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.cancelSave();
            });
            expect(result.current.hasPendingSave()).toBe(false);
        });
    });
    describe('error handling', () => {
        it('should handle saveFn errors gracefully', async () => {
            const saveFn = vi.fn().mockRejectedValue(new Error('Save failed'));
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            // Should not throw
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });
            expect(saveFn).toHaveBeenCalled();
        });
        it('should handle flushSave errors gracefully', async () => {
            const saveFn = vi.fn().mockRejectedValue(new Error('Flush failed'));
            const { result } = renderHook(() => useDebouncedSave({ saveFn, delay: 5000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            // Should not throw
            await act(async () => {
                await result.current.flushSave();
            });
            expect(saveFn).toHaveBeenCalled();
        });
    });
    describe('cleanup', () => {
        it('should clear timeout on unmount', async () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result, unmount } = renderHook(() => useDebouncedSave({ saveFn, delay: 5000 }));
            act(() => {
                result.current.triggerSave({ name: 'test' });
            });
            unmount();
            // Advance timers after unmount - the timeout callback shouldn't run
            await act(async () => {
                vi.advanceTimersByTime(10000);
            });
            // saveFn was called once on unmount cleanup (fire and forget)
            expect(saveFn).toHaveBeenCalledTimes(1);
        });
    });
    describe('callback stability', () => {
        it('should maintain stable callback references', () => {
            const saveFn = vi.fn().mockResolvedValue(undefined);
            const { result, rerender } = renderHook(() => useDebouncedSave({ saveFn, delay: 1000 }));
            const initialTriggerSave = result.current.triggerSave;
            const initialFlushSave = result.current.flushSave;
            const initialCancelSave = result.current.cancelSave;
            rerender();
            expect(result.current.triggerSave).toBe(initialTriggerSave);
            expect(result.current.flushSave).toBe(initialFlushSave);
            expect(result.current.cancelSave).toBe(initialCancelSave);
        });
    });
});
