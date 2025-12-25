import { useState } from 'react';
import { toast } from 'sonner';

/**
 * @deprecated Use `useAsyncMutation` instead. This hook will be removed in a future version.
 *
 * Migration guide:
 * ```tsx
 * // Before:
 * const { execute, isLoading } = useAsyncAction(
 *   eventService.updateEvent,
 *   {
 *     successMessage: 'Event updated',
 *     errorMessage: 'Failed to update',
 *     onSuccess: () => navigate('/events'),
 *   }
 * );
 * await execute(eventId, data);
 *
 * // After:
 * const { execute, isLoading } = useAsyncMutation({
 *   mutationFn: ({ eventId, data }) => eventService.updateEvent(eventId, data),
 *   successMessage: 'Event updated',
 *   errorMessage: 'Failed to update',
 *   onSuccess: () => navigate('/events'),
 *   throwOnError: true, // Matches old behavior of throwing on error
 * });
 * await execute({ eventId, data });
 * ```
 *
 * Key differences:
 * - `useAsyncMutation` takes a single variables object instead of spread args
 * - Add `throwOnError: true` if you need the old error-throwing behavior
 * - `useAsyncMutation` has additional features like React Query invalidation
 *
 * useAsyncAction Hook
 *
 * Generic hook for handling async actions with loading states and error handling.
 * Eliminates duplicate loading state management found in 22+ components.
 *
 * @example
 * const { execute: saveEvent, isLoading } = useAsyncAction(
 *   eventService.updateEvent,
 *   {
 *     successMessage: 'Event updated successfully',
 *     errorMessage: 'Failed to update event',
 *     onSuccess: () => navigate('/events'),
 *   }
 * );
 */

export interface UseAsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useAsyncAction<T = any, Args extends any[] = any[]>(
  action: (...args: Args) => Promise<T>,
  options: UseAsyncActionOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const execute = async (...args: Args): Promise<T> => {
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
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      if (showErrorToast && errorMessage) {
        toast.error(errorMessage, {
          description: error.message,
        });
      }

      onError?.(error);
      throw error;
    } finally {
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
