import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';

/**
 * Configuration for the delete confirmation hook
 */
export interface UseDeleteConfirmationOptions<T> {
  /** Supabase table name to delete from */
  table: string;
  /** React Query key(s) to invalidate after successful deletion */
  queryKey: string[];
  /** Function to get the ID from the item (default: item.id) */
  getId?: (item: T) => string;
  /** Toast messages */
  messages?: {
    /** Success message for single deletion */
    successSingle?: string;
    /** Success message for multiple deletions - either a string or function receiving count */
    successMultiple?: string | ((count: number) => string);
    /** Error message */
    error?: string;
  };
  /** Optional validation before showing confirm dialog. Return error message to block, or undefined to allow */
  validate?: (items: T[]) => string | undefined;
  /** Custom delete function (bypasses default Supabase delete) */
  onDelete?: (items: T[]) => Promise<void>;
  /** Callback after successful deletion */
  onSuccess?: (items: T[]) => void;
  /** Source name for logging */
  source?: string;
}

/**
 * Return type for the delete confirmation hook
 */
export interface UseDeleteConfirmationReturn<T> {
  /** Whether the confirm dialog is open */
  showConfirm: boolean;
  /** Items to be deleted */
  itemsToDelete: T[];
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Open the confirm dialog with items to delete */
  openConfirm: (items: T | T[]) => void;
  /** Execute the deletion */
  confirmDelete: () => Promise<void>;
  /** Cancel and close the dialog */
  cancelDelete: () => void;
  /** Set the open state of the dialog (for controlled mode) */
  setShowConfirm: (open: boolean) => void;
}

/**
 * Hook for managing delete confirmation dialogs with Supabase integration.
 * Handles single and bulk deletions with consistent state management,
 * React Query cache invalidation, and toast notifications.
 *
 * @example
 * ```tsx
 * const {
 *   showConfirm,
 *   itemsToDelete,
 *   isDeleting,
 *   openConfirm,
 *   confirmDelete,
 *   setShowConfirm,
 * } = useDeleteConfirmation<User>({
 *   table: 'users',
 *   queryKey: ['admin-users'],
 *   messages: {
 *     successSingle: 'User deleted',
 *     successMultiple: 'Users deleted',
 *     error: 'Failed to delete user',
 *   },
 * });
 *
 * // In context menu action:
 * onClick: (user) => openConfirm(user)
 *
 * // In component JSX:
 * <FmCommonConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   onConfirm={confirmDelete}
 *   isLoading={isDeleting}
 *   // ...
 * />
 * ```
 */
export function useDeleteConfirmation<T extends { id?: string }>(
  options: UseDeleteConfirmationOptions<T>
): UseDeleteConfirmationReturn<T> {
  const {
    table,
    queryKey,
    getId = (item: T) => item.id as string,
    messages = {},
    validate,
    onDelete,
    onSuccess,
    source = 'useDeleteConfirmation',
  } = options;

  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<T[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const openConfirm = useCallback(
    (items: T | T[]) => {
      const itemArray = Array.isArray(items) ? items : [items];

      // Run validation if provided
      if (validate) {
        const errorMessage = validate(itemArray);
        if (errorMessage) {
          toast.error(errorMessage);
          return;
        }
      }

      setItemsToDelete(itemArray);
      setShowConfirm(true);
    },
    [validate]
  );

  const cancelDelete = useCallback(() => {
    setShowConfirm(false);
    setItemsToDelete([]);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (itemsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      // Use custom delete function if provided, otherwise use Supabase
      if (onDelete) {
        await onDelete(itemsToDelete);
      } else {
        // Delete all selected items
        // Note: Type assertion needed because table name is dynamic
        const deletePromises = itemsToDelete.map(item =>
          supabase.from(table as 'events').delete().eq('id', getId(item))
        );

        const results = await Promise.all(deletePromises);

        // Check if any deletions failed
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          throw new Error(`Failed to delete ${errors.length} item(s)`);
        }
      }

      // Show success message
      let successMessage: string;
      if (itemsToDelete.length === 1) {
        successMessage = messages.successSingle || 'Item deleted';
      } else if (typeof messages.successMultiple === 'function') {
        successMessage = messages.successMultiple(itemsToDelete.length);
      } else {
        successMessage = messages.successMultiple || `${itemsToDelete.length} items deleted`;
      }

      toast.success(successMessage);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey });

      // Call success callback
      onSuccess?.(itemsToDelete);

      // Reset state
      setShowConfirm(false);
      setItemsToDelete([]);
    } catch (error) {
      logger.error('Error deleting item(s)', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source,
        details: { table, itemCount: itemsToDelete.length },
      });
      toast.error(messages.error || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  }, [
    itemsToDelete,
    table,
    queryKey,
    getId,
    messages,
    onDelete,
    onSuccess,
    queryClient,
    source,
  ]);

  return {
    showConfirm,
    itemsToDelete,
    isDeleting,
    openConfirm,
    confirmDelete,
    cancelDelete,
    setShowConfirm,
  };
}
