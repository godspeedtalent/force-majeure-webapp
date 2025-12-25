import { useState, useCallback, useRef } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * @deprecated Use `useAsyncMutation` instead. This hook will be removed in a future version.
 *
 * Migration guide:
 * ```tsx
 * // Before:
 * const { mutate, isLoading } = useMutationWithToast({
 *   mutationFn: (data) => api.updateUser(data),
 *   successMessage: 'User updated',
 *   errorTitle: 'Failed to update',
 *   invalidateKeys: [['users']],
 * });
 *
 * // After:
 * const { mutate, isLoading } = useAsyncMutation({
 *   mutationFn: (data) => api.updateUser(data),
 *   successMessage: 'User updated',
 *   errorMessage: 'Failed to update', // Note: renamed from errorTitle
 *   invalidateKeys: [['users']],
 * });
 * ```
 *
 * useMutationWithToast
 *
 * A hook that wraps async mutation operations with automatic toast notifications
 * and React Query cache invalidation.
 *
 * Features:
 * - Automatic success/error toast notifications
 * - Query invalidation on success
 * - Loading state management
 * - Configurable callbacks
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMutationWithToast({
 *   mutationFn: (data) => api.updateUser(data),
 *   successMessage: 'User updated successfully',
 *   errorTitle: 'Failed to update user',
 *   invalidateKeys: [['users'], ['user', userId]],
 * });
 *
 * await mutate({ name: 'John' });
 * ```
 */

export interface UseMutationWithToastOptions<TData, TVariables> {
  /**
   * The async function to execute
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Toast message shown on success
   */
  successMessage?: string;

  /**
   * Title for error toast (error message is appended)
   */
  errorTitle?: string;

  /**
   * Callback executed on successful mutation
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Callback executed on failed mutation
   */
  onError?: (error: Error, variables: TVariables) => void;

  /**
   * Query keys to invalidate on success
   * Each array is a query key that will be invalidated
   */
  invalidateKeys?: QueryKey[];

  /**
   * Whether to show success toast (default: true if successMessage provided)
   */
  showSuccessToast?: boolean;

  /**
   * Whether to show error toast (default: true)
   */
  showErrorToast?: boolean;
}

export interface UseMutationWithToastReturn<TData, TVariables> {
  /**
   * Execute the mutation
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

export function useMutationWithToast<TData, TVariables = void>(
  options: UseMutationWithToastOptions<TData, TVariables>
): UseMutationWithToastReturn<TData, TVariables> {
  const {
    mutationFn,
    successMessage,
    errorTitle = 'An error occurred',
    onSuccess,
    onError,
    invalidateKeys,
    showSuccessToast = !!successMessage,
    showErrorToast = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const queryClient = useQueryClient();

  // Use ref to store options to avoid re-creating mutate callback
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);

        // Invalidate queries
        if (invalidateKeys && invalidateKeys.length > 0) {
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
      errorTitle,
      onSuccess,
      onError,
    ]
  );

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
