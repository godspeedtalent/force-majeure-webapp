import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMutationWithToast } from './useMutationWithToast';
// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));
import { toast } from 'sonner';
// Create a wrapper with QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return function Wrapper({ children }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}
describe('useMutationWithToast', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('initialization', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
            }), { wrapper: createWrapper() });
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.data).toBeNull();
        });
    });
    describe('successful mutation', () => {
        it('should execute mutation and return result', async () => {
            const mutationFn = vi.fn().mockResolvedValue('success data');
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn,
            }), { wrapper: createWrapper() });
            let returnValue;
            await act(async () => {
                returnValue = await result.current.mutate(undefined);
            });
            expect(returnValue).toBe('success data');
            expect(result.current.data).toBe('success data');
            expect(result.current.error).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });
        it('should set isLoading during execution', async () => {
            let resolvePromise;
            const pendingPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: () => pendingPromise,
            }), { wrapper: createWrapper() });
            let mutationPromise;
            act(() => {
                mutationPromise = result.current.mutate(undefined);
            });
            // Should be loading while pending
            expect(result.current.isLoading).toBe(true);
            await act(async () => {
                resolvePromise('done');
                await mutationPromise;
            });
            expect(result.current.isLoading).toBe(false);
        });
        it('should show success toast when successMessage is provided', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
                successMessage: 'Operation completed',
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(toast.success).toHaveBeenCalledWith('Operation completed');
        });
        it('should not show success toast when successMessage is not provided', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(toast.success).not.toHaveBeenCalled();
        });
        it('should not show success toast when showSuccessToast is false', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
                successMessage: 'Operation completed',
                showSuccessToast: false,
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(toast.success).not.toHaveBeenCalled();
        });
        it('should call onSuccess callback with data and variables', async () => {
            const onSuccess = vi.fn();
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
                onSuccess,
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate({ name: 'test' });
            });
            expect(onSuccess).toHaveBeenCalledWith('result', { name: 'test' });
        });
        it('should pass variables to mutation function', async () => {
            const mutationFn = vi.fn().mockResolvedValue('result');
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn,
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate({ id: 1, name: 'test' });
            });
            expect(mutationFn).toHaveBeenCalledWith({ id: 1, name: 'test' });
        });
    });
    describe('failed mutation', () => {
        it('should set error on failure', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Test error');
                },
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.error?.message).toBe('Test error');
            expect(result.current.data).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });
        it('should return undefined on failure', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Test error');
                },
            }), { wrapper: createWrapper() });
            let returnValue = 'initial';
            await act(async () => {
                returnValue = await result.current.mutate(undefined);
            });
            expect(returnValue).toBeUndefined();
        });
        it('should show error toast with custom title', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Connection failed');
                },
                errorTitle: 'Update failed',
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(toast.error).toHaveBeenCalledWith('Update failed', {
                description: 'Connection failed',
            });
        });
        it('should show error toast with default title', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Something broke');
                },
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(toast.error).toHaveBeenCalledWith('An error occurred', {
                description: 'Something broke',
            });
        });
        it('should not show error toast when showErrorToast is false', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Test error');
                },
                showErrorToast: false,
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(toast.error).not.toHaveBeenCalled();
        });
        it('should call onError callback with error and variables', async () => {
            const onError = vi.fn();
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Test error');
                },
                onError,
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate({ name: 'test' });
            });
            expect(onError).toHaveBeenCalledWith(expect.any(Error), { name: 'test' });
            expect(onError.mock.calls[0][0].message).toBe('Test error');
        });
        it('should convert non-Error throws to Error', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw 'string error';
                },
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.error?.message).toBe('string error');
        });
    });
    describe('query invalidation', () => {
        it('should invalidate specified query keys on success', async () => {
            const queryClient = new QueryClient();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: queryClient }, children);
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
                invalidateKeys: [['users'], ['user', '123']],
            }), { wrapper });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', '123'] });
        });
        it('should not invalidate queries on failure', async () => {
            const queryClient = new QueryClient();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }) => React.createElement(QueryClientProvider, { client: queryClient }, children);
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Failed');
                },
                invalidateKeys: [['users']],
            }), { wrapper });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(invalidateSpy).not.toHaveBeenCalled();
        });
    });
    describe('reset', () => {
        it('should reset all state', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'data',
            }), { wrapper: createWrapper() });
            // Execute mutation
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.data).toBe('data');
            // Reset
            act(() => {
                result.current.reset();
            });
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.data).toBeNull();
        });
        it('should reset error state', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    throw new Error('Test error');
                },
            }), { wrapper: createWrapper() });
            // Execute mutation (will fail)
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.error).not.toBeNull();
            // Reset
            act(() => {
                result.current.reset();
            });
            expect(result.current.error).toBeNull();
        });
    });
    describe('callback stability', () => {
        it('should maintain stable reset callback reference', () => {
            const { result, rerender } = renderHook(() => useMutationWithToast({
                mutationFn: async () => 'result',
            }), { wrapper: createWrapper() });
            const initialReset = result.current.reset;
            rerender();
            // Reset should remain stable since it has no dependencies
            expect(result.current.reset).toBe(initialReset);
        });
        it('should provide working mutate function after rerender', async () => {
            const mutationFn = vi.fn().mockResolvedValue('result');
            const { result, rerender } = renderHook(() => useMutationWithToast({
                mutationFn,
            }), { wrapper: createWrapper() });
            rerender();
            // Mutate should still work after rerender
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(mutationFn).toHaveBeenCalled();
            expect(result.current.data).toBe('result');
        });
    });
    describe('complex data types', () => {
        it('should handle complex return types', async () => {
            const testUser = { id: '1', name: 'John', email: 'john@example.com' };
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async (variables) => ({
                    ...testUser,
                    name: variables.name,
                }),
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate({ name: 'Jane' });
            });
            expect(result.current.data).toEqual({
                id: '1',
                name: 'Jane',
                email: 'john@example.com',
            });
        });
    });
    describe('void mutations', () => {
        it('should handle void return type', async () => {
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => { },
                successMessage: 'Deleted successfully',
            }), { wrapper: createWrapper() });
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.error).toBeNull();
            expect(toast.success).toHaveBeenCalledWith('Deleted successfully');
        });
    });
    describe('clear previous error', () => {
        it('should clear previous error on new mutation', async () => {
            let shouldFail = true;
            const { result } = renderHook(() => useMutationWithToast({
                mutationFn: async () => {
                    if (shouldFail) {
                        throw new Error('First error');
                    }
                    return 'success';
                },
            }), { wrapper: createWrapper() });
            // First mutation fails
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.error?.message).toBe('First error');
            // Second mutation succeeds
            shouldFail = false;
            await act(async () => {
                await result.current.mutate(undefined);
            });
            expect(result.current.error).toBeNull();
            expect(result.current.data).toBe('success');
        });
    });
});
