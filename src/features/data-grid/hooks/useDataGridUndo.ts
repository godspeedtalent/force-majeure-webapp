import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Represents an undoable action in the data grid
 */
export interface UndoableAction<T = Record<string, unknown>> {
  type: 'cell_update' | 'batch_delete' | 'bulk_edit' | 'create';
  timestamp: number;
  /** The row that was modified */
  row?: T;
  /** The column key that was changed (for cell updates) */
  columnKey?: string;
  /** The previous value before the change */
  oldValue?: unknown;
  /** The new value after the change */
  newValue?: unknown;
  /** Multiple rows for batch operations */
  rows?: T[];
  /** Display name for the toast */
  displayName?: string;
}

interface UseDataGridUndoOptions<T> {
  /** Function to update a row (used for undoing cell updates) */
  onUpdate?: (row: T, columnKey?: string, newValue?: unknown) => Promise<void>;
  /** Function to restore deleted rows */
  onRestore?: (rows: T[]) => Promise<void>;
  /** Function to delete a created row */
  onDelete?: (row: T) => Promise<void>;
}

/**
 * Hook for managing undo functionality in the data grid
 * Tracks the last action and provides the ability to undo it
 */
export function useDataGridUndo<T extends Record<string, unknown>>({
  onUpdate,
  onRestore,
  onDelete,
}: UseDataGridUndoOptions<T> = {}) {
  const { t } = useTranslation('common');
  const [lastAction, setLastAction] = useState<UndoableAction<T> | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the last action after a timeout (undo window expires)
  const UNDO_WINDOW_MS = 10000; // 10 seconds

  /**
   * Record an action that can be undone
   */
  const recordAction = useCallback((action: Omit<UndoableAction<T>, 'timestamp'>) => {
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    const fullAction: UndoableAction<T> = {
      ...action,
      timestamp: Date.now(),
    };

    setLastAction(fullAction);

    // Set timeout to clear the action after the undo window
    undoTimeoutRef.current = setTimeout(() => {
      setLastAction(prev => {
        // Only clear if it's the same action
        if (prev?.timestamp === fullAction.timestamp) {
          return null;
        }
        return prev;
      });
    }, UNDO_WINDOW_MS);

    return fullAction;
  }, []);

  /**
   * Perform the undo operation
   */
  const undo = useCallback(async () => {
    if (!lastAction || isUndoing) return false;

    setIsUndoing(true);
    const loadingToast = toast.loading(t('dataGrid.undoing'));

    try {
      switch (lastAction.type) {
        case 'cell_update':
          if (onUpdate && lastAction.row && lastAction.columnKey !== undefined) {
            await onUpdate(lastAction.row, lastAction.columnKey, lastAction.oldValue);
          }
          break;

        case 'batch_delete':
          if (onRestore && lastAction.rows) {
            await onRestore(lastAction.rows);
          }
          break;

        case 'create':
          if (onDelete && lastAction.row) {
            await onDelete(lastAction.row);
          }
          break;

        case 'bulk_edit':
          // For bulk edits, we would need to restore each row's original values
          // This would require storing all original values, which is complex
          // For now, just log that this is not supported
          toast.dismiss(loadingToast);
          toast.error(t('dataGrid.undoNotSupported'));
          setIsUndoing(false);
          return false;
      }

      toast.dismiss(loadingToast);
      toast.success(t('dataGrid.undoSuccessful'));
      setLastAction(null);
      setIsUndoing(false);
      return true;
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(t('dataGrid.undoFailed'));
      setIsUndoing(false);
      return false;
    }
  }, [lastAction, isUndoing, onUpdate, onRestore, onDelete, t]);

  /**
   * Clear the undo history
   */
  const clearUndoHistory = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setLastAction(null);
  }, []);

  /**
   * Show a success toast with an undo action button
   */
  const showSuccessWithUndo = useCallback((
    message: string,
    action: Omit<UndoableAction<T>, 'timestamp'>
  ) => {
    const recorded = recordAction(action);

    toast.success(message, {
      duration: UNDO_WINDOW_MS,
      action: {
        label: t('dataGrid.undo'),
        onClick: () => {
          // The recorded action is in state, so undo will work
          undo();
        },
      },
    });

    return recorded;
  }, [recordAction, undo, t]);

  return {
    lastAction,
    isUndoing,
    recordAction,
    undo,
    clearUndoHistory,
    showSuccessWithUndo,
    canUndo: !!lastAction && !isUndoing,
  };
}
