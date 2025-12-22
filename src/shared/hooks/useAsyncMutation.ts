import { useState, useCallback } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * useAsyncMutation
 *
 * Unified hook for async operations with loading states, toast notifications,
 * and optional React Query cache invalidation.
 *
 * This hook consolidates the functionality of useAsyncAction and useMutationWithToast
 * into a single, consistent API.
 *
 * @example Basic usage (replaces useAsyncAction)
 * ```tsx
 * const { execute, isLoading } = useAsyncMutation({
 *   mutationFn: (id: string) => api.deleteItem(id),
 *   successMessage: 'Item deleted',
 *   errorMessage: 'Failed to delete item',
 * });
 *
 * await execute(itemId);
 * ```
 *
 * @example With React Query invalidation (replaces useMutationWithToast)
 * ```tsx
 * const { execute, isLoading } = useAsyncMutation({
 *   mutationFn: (data) => api.updateUser(data),
 *   successMessage: 'User updated',
 *   errorMessage: 'Failed to update user',
 *   invalidateKeys: [['users'], ['user', userId]],
 *   onSuccess: () => navigate('/users'),
 * });
 * ```
 *
 * @example Throwing on error (legacy useAsyncAction behavior)
 * ```tsx
 * const { execute, isLoading } = useAsyncMutation({
 *   mutationFn: saveData,
 *   throwOnError: true,
 * });
 *
 * try {
 *   await execute(data);
 * } catch (err) {
 *   // Handle error
 * }
 * ```
 */

export interface UseAsyncMutationOptions<TData, TVariables> {
  /**
   * The async function to execute
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Toast message shown on success
   */
  successMessage?: string;

  /**
   * Toast message/title shown on error
   */
  errorMessage?: string;

  /**
   * Callback executed on successful mutation
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Callback executed on failed mutation
   */
  onError?: (error: Error, variables: TVariables) => void;

  /**
   * Query keys to invalidate on success (requires React Query)
   * Each array is a query key that will be invalidated
   */
  invalidateKeys?: QueryKey[];

  /**
   * Whether to show success toast (default: true if successMessage provided)
   */
  showSuccessToast?: boolean;

  /**
   * Whether to show error toast (default: true if errorMessage provided)
   */
  showErrorToast?: boolean;

  /**
   * Whether to throw the error after handling (default: false)
   * Set to true for legacy useAsyncAction behavior
   */
  throwOnError?: boolean;
}

export interface UseAsyncMutationReturn<TData, TVariables> {
  /**
   * Execute the mutation
   */
  execute: (variables: TVariables) => Promise<TData | undefined>;

  /**
   * Alias for execute (for useMutationWithToast compatibility)
   */
  mutate: (variables: TVariables) => Promise<TData | undefined>;

  /**
   * Whether the mutation is currently executing
   */
  isLoading: boolean;

  /**
   * The last error that occurred, if any
   */
  error: Error | null;

  /**
   * The data returned from the last successful mutation
   */
  data: TData | null;

  /**
   * Reset the mutation state
   */
  reset: () => void;
}

export function useAsyncMutation<TData, TVariables = void>(
  options: UseAsyncMutationOptions<TData, TVariables>
): UseAsyncMutationReturn<TData, TVariables> {
  const {
    mutationFn,
    successMessage,
    errorMessage = 'An error occurred',
    onSuccess,
    onError,
    invalidateKeys,
    showSuccessToast = !!successMessage,
    showErrorToast = !!errorMessage,
    throwOnError = false,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  // Only use queryClient if invalidateKeys are provided
  const queryClient = invalidateKeys?.length ? useQueryClient() : null;

  const execute = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);

        // Invalidate queries if React Query is being used
        if (queryClient && invalidateKeys && invalidateKeys.length > 0) {
          await Promise.all(
            invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
          );
        }

        // Show success toast
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        // Call success callback
        onSuccess?.(result, variables);

        return result;
      } catch (err) {
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
      } finally {
        setIsLoading(false);
      }
    },
    [
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
    ]
  );

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
export function useAsyncMutationSimple<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<UseAsyncMutationOptions<TData, TVariables>, 'mutationFn' | 'invalidateKeys'> = {}
): UseAsyncMutationReturn<TData, TVariables> {
  return useAsyncMutation({
    mutationFn,
    ...options,
  });
}
