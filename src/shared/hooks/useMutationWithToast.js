import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
export function useMutationWithToast(options) {
    const { mutationFn, successMessage, errorTitle = 'An error occurred', onSuccess, onError, invalidateKeys, showSuccessToast = !!successMessage, showErrorToast = true, } = options;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const queryClient = useQueryClient();
    // Use ref to store options to avoid re-creating mutate callback
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const mutate = useCallback(async (variables) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutationFn(variables);
            setData(result);
            // Invalidate queries
            if (invalidateKeys && invalidateKeys.length > 0) {
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
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            // Show error toast
            if (showErrorToast) {
                toast.error(errorTitle, {
                    description: error.message,
                });
            }
            // Call error callback
            onError?.(error, variables);
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
        errorTitle,
        onSuccess,
        onError,
    ]);
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);
    return {
        mutate,
        isLoading,
        error,
        data,
        reset,
    };
}
