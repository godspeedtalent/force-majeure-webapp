import { useState, useCallback } from 'react';
/**
 * Hook for managing async operation state (loading, error, data)
 *
 * Provides a standardized interface for handling async operations with
 * automatic loading state management and error handling.
 *
 * @returns Async operation state and control functions
 *
 * @example
 * ```tsx
 * const { execute, isLoading, error, data } = useAsyncOperation<User>();
 *
 * const handleFetch = async () => {
 *   const user = await execute(async () => {
 *     const response = await fetch('/api/user');
 *     return response.json();
 *   });
 *   if (user) {
 *     console.log('Fetched user:', user);
 *   }
 * };
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (data) return <UserProfile user={data} />;
 * ```
 *
 * @example
 * ```tsx
 * // With manual reset
 * const saveOp = useAsyncOperation<void>();
 *
 * const handleSave = async () => {
 *   await saveOp.execute(async () => {
 *     await api.saveData(formData);
 *   });
 *   // On success, reset for next operation
 *   saveOp.reset();
 * };
 * ```
 */
export function useAsyncOperation() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const execute = useCallback(async (fn) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fn();
            setData(result);
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            return null;
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);
    return {
        execute,
        isLoading,
        error,
        data,
        reset,
    };
}
