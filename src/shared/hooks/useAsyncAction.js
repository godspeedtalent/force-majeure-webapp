import { useState } from 'react';
import { toast } from 'sonner';
export function useAsyncAction(action, options = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const { onSuccess, onError, successMessage, errorMessage, showSuccessToast = true, showErrorToast = true, } = options;
    const execute = async (...args) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await action(...args);
            setData(result);
            if (showSuccessToast && successMessage) {
                toast.success(successMessage);
            }
            onSuccess?.(result);
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            if (showErrorToast && errorMessage) {
                toast.error(errorMessage, {
                    description: error.message,
                });
            }
            onError?.(error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    };
    const reset = () => {
        setIsLoading(false);
        setError(null);
        setData(null);
    };
    return {
        execute,
        isLoading,
        error,
        data,
        reset,
    };
}
