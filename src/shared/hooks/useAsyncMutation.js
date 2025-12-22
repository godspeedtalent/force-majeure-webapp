import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
export function useAsyncMutation(options) {
    const { mutationFn, successMessage, errorMessage = 'An error occurred', onSuccess, onError, invalidateKeys, showSuccessToast = !!successMessage, showErrorToast = !!errorMessage, throwOnError = false, } = options;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    // Only use queryClient if invalidateKeys are provided
    const queryClient = invalidateKeys?.length ? useQueryClient() : null;
    const execute = useCallback(async (variables) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutationFn(variables);
            setData(result);
            // Invalidate queries if React Query is being used
            if (queryClient && invalidateKeys && invalidateKeys.length > 0) {
                await Promise.all(invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key })));
            }
            // Show success toast
            if (showSuccessToast && successMessage) {
                toast.success(successMessage);
            }
            // Call success callback
            onSuccess?.(result, variables);
            return result;
        }
        catch (err) {
            const normalizedError = err instanceof Error ? err : new Error(String(err));
            setError(normalizedError);
            // Show error toast
            if (showErrorToast && errorMessage) {
                toast.error(errorMessage, {
                    description: normalizedError.message,
                });
            }
            // Call error callback
            onError?.(normalizedError, variables);
            // Optionally throw for legacy useAsyncAction behavior
            if (throwOnError) {
                throw normalizedError;
            }
            return undefined;
        }
        finally {
            setIsLoading(false);
        }
    }, [
        mutationFn,
        invalidateKeys,
        queryClient,
        showSuccessToast,
        successMessage,
        showErrorToast,
        errorMessage,
        onSuccess,
        onError,
        throwOnError,
    ]);
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);
    return {
        execute,
        mutate: execute, // Alias for compatibility
        isLoading,
        error,
        data,
        reset,
    };
}
/**
 * Simplified version without React Query dependency
 * Use this when you don't need cache invalidation
 */
export function useAsyncMutationSimple(mutationFn, options = {}) {
    return useAsyncMutation({
        mutationFn,
        ...options,
    });
}
