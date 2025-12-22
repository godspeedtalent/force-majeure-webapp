import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';
describe('useDebounce', () => {
    it('returns initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });
    it('debounces value changes', async () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), { initialProps: { value: 'initial', delay: 50 } });
        expect(result.current).toBe('initial');
        // Change value
        rerender({ value: 'changed', delay: 50 });
        expect(result.current).toBe('initial'); // Still old value
        // Wait for debounce
        await waitFor(() => {
            expect(result.current).toBe('changed');
        }, { timeout: 200 });
    });
    it('cancels previous timeout when value changes rapidly', async () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), { initialProps: { value: 'initial' } });
        // Change value multiple times rapidly
        rerender({ value: 'change1' });
        await new Promise(resolve => setTimeout(resolve, 20));
        rerender({ value: 'change2' });
        await new Promise(resolve => setTimeout(resolve, 20));
        rerender({ value: 'change3' });
        // Not enough time has passed for any to trigger
        expect(result.current).toBe('initial');
        // Wait for debounce to complete
        await waitFor(() => {
            expect(result.current).toBe('change3'); // Only last value should apply
        }, { timeout: 300 });
    });
    it('uses default delay of 500ms', async () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value), { initialProps: { value: 'initial' } });
        rerender({ value: 'changed' });
        // Should still be initial after short wait
        await new Promise(resolve => setTimeout(resolve, 200));
        expect(result.current).toBe('initial');
        // Should be changed after full delay
        await waitFor(() => {
            expect(result.current).toBe('changed');
        }, { timeout: 600 });
    });
    it('handles custom delay', async () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), { initialProps: { value: 'initial', delay: 150 } });
        rerender({ value: 'changed', delay: 150 });
        // Should still be initial after short wait
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(result.current).toBe('initial');
        // Should be changed after custom delay
        await waitFor(() => {
            expect(result.current).toBe('changed');
        }, { timeout: 300 });
    });
    it('handles delay changes', async () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), { initialProps: { value: 'initial', delay: 50 } });
        rerender({ value: 'changed', delay: 150 }); // Change both value and delay
        // Should still be initial after old delay duration
        await new Promise(resolve => setTimeout(resolve, 70));
        expect(result.current).toBe('initial'); // Old delay doesn't apply
        // Should be changed after new delay applies
        await waitFor(() => {
            expect(result.current).toBe('changed'); // New delay applies
        }, { timeout: 300 });
    });
    it('works with different value types', async () => {
        // Number
        const { result: numberResult, rerender: numberRerender } = renderHook(({ value }) => useDebounce(value, 50), { initialProps: { value: 0 } });
        numberRerender({ value: 42 });
        await waitFor(() => expect(numberResult.current).toBe(42), {
            timeout: 200,
        });
        // Boolean
        const { result: boolResult, rerender: boolRerender } = renderHook(({ value }) => useDebounce(value, 50), { initialProps: { value: false } });
        boolRerender({ value: true });
        await waitFor(() => expect(boolResult.current).toBe(true), {
            timeout: 200,
        });
        // Object
        const { result: objResult, rerender: objRerender } = renderHook(({ value }) => useDebounce(value, 50), { initialProps: { value: { id: 1 } } });
        const newObj = { id: 2 };
        objRerender({ value: newObj });
        await waitFor(() => expect(objResult.current).toEqual(newObj), {
            timeout: 200,
        });
    });
    it('handles null and undefined', async () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), { initialProps: { value: 'initial' } });
        rerender({ value: null });
        await waitFor(() => expect(result.current).toBe(null), { timeout: 200 });
        rerender({ value: undefined });
        await waitFor(() => expect(result.current).toBe(undefined), {
            timeout: 200,
        });
    });
    it('cleans up timeout on unmount', () => {
        vi.useFakeTimers();
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        const { unmount } = renderHook(() => useDebounce('test', 500));
        unmount();
        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
        vi.useRealTimers();
    });
});
