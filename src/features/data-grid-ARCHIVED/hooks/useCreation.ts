import React, { useState, useCallback } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { CreationState } from '../types';

/**
 * Hook for managing row creation state
 */
export function useCreation<TData>(
  onCreate?: (newRow: Partial<TData>) => Promise<void>,
  resourceName = 'Resource'
): CreationState<TData> {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<TData>>({});

  const startCreate = useCallback(() => {
    setIsCreating(true);
    setNewRowData({});
  }, []);

  const cancelCreate = useCallback(() => {
    setIsCreating(false);
    setNewRowData({});
  }, []);

  const saveCreate = useCallback(async () => {
    if (!onCreate) return;

    // Show loading toast
    const loadingToast = toast({
      title: `Creating ${resourceName}...`,
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
      await onCreate(newRowData);

      loadingToast.dismiss();
      toast({
        title: `${resourceName} created successfully.`,
        duration: 2000,
      });

      setIsCreating(false);
      setNewRowData({});
    } catch (error) {
      loadingToast.dismiss();
      toast({
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [onCreate, newRowData, resourceName, toast]);

  const updateNewRowField = useCallback((key: string, value: any) => {
    setNewRowData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  return {
    isCreating,
    newRowData,
    startCreate,
    cancelCreate,
    saveCreate,
    updateNewRowField,
  };
}
