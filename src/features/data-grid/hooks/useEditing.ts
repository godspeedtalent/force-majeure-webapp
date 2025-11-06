import React, { useState, useCallback } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { EditingState } from '../types';

/**
 * Hook for managing cell editing state
 */
export function useEditing<TData>(
  onUpdate?: (row: TData, columnKey: string, newValue: any) => Promise<void>,
  resourceName = 'Resource'
): EditingState {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEdit = useCallback((rowIndex: number, columnKey: string, currentValue: any) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(currentValue?.toString() || '');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const saveEdit = useCallback(async (
    row: any,
    columnKey: string,
    overrideValue?: any
  ) => {
    if (!onUpdate || !editingCell) return;

    let newValue = overrideValue !== undefined ? overrideValue : editValue;
    const oldValue = row[columnKey];

    // Don't update if unchanged
    if (newValue === oldValue?.toString() || (!newValue && !oldValue)) {
      setEditingCell(null);
      return;
    }

    // Get display name for toasts
    const displayName = (row as any).name || resourceName;

    // Show loading toast
    const loadingToast = toast({
      title: `Updating ${displayName}...`,
      description: React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement('div', {
          className: 'h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin'
        }),
        React.createElement('span', null, 'Please wait...')
      ),
      duration: Infinity,
    });

    try {
      await onUpdate(row as TData, columnKey, newValue);

      loadingToast.dismiss();
      toast({
        title: `${displayName} updated.`,
        duration: 2000,
      });

      setEditingCell(null);
    } catch (error) {
      loadingToast.dismiss();
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [editingCell, editValue, onUpdate, resourceName, toast]);

  return {
    editingCell,
    editValue,
    startEdit,
    cancelEdit,
    saveEdit,
    setEditValue,
  };
}
