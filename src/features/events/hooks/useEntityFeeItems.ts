import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';

export type EntityType = 'event' | 'group' | 'tier';
export type FeeType = 'flat' | 'percentage';

export interface FeeItem {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  label: string;
  fee_type: FeeType;
  fee_value: number; // cents for flat, basis points for percentage
  sort_order: number;
  is_active: boolean;
}

export interface CreateFeeItemInput {
  label: string;
  fee_type: FeeType;
  fee_value: number;
  sort_order?: number;
}

export interface UpdateFeeItemInput {
  id: string;
  label?: string;
  fee_type?: FeeType;
  fee_value?: number;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Hook for managing fee items on an entity (event, group, or tier)
 *
 * Supports the hierarchical fee inheritance system where entities can
 * inherit parent fees AND add their own additional fees.
 */
export function useEntityFeeItems(entityType: EntityType, entityId: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Query: Get fee items for this entity
  // Note: entity_fee_items table exists in DB but may not be in generated types yet
  const { data: feeItems = [], isLoading } = useQuery<FeeItem[]>({
    queryKey: ['entity-fee-items', entityType, entityId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('entity_fee_items')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as FeeItem[];
    },
    enabled: !!entityId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation: Create a new fee item
  const createMutation = useMutation({
    mutationFn: async (input: CreateFeeItemInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('entity_fee_items')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          label: input.label,
          fee_type: input.fee_type,
          fee_value: input.fee_value,
          sort_order: input.sort_order ?? feeItems.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FeeItem;
    },
    onSuccess: () => {
      toast.success(t('fees.feeItemAdded'));
      queryClient.invalidateQueries({ queryKey: ['entity-fee-items', entityType, entityId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('fees.feeItemAddFailed'));
      logger.error('Failed to add fee item', {
        error: message,
        source: 'useEntityFeeItems.create',
        entityType,
        entityId,
      });
    },
  });

  // Mutation: Update an existing fee item
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateFeeItemInput) => {
      const { id, ...updates } = input;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('entity_fee_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FeeItem;
    },
    onSuccess: () => {
      toast.success(t('fees.feeItemUpdated'));
      queryClient.invalidateQueries({ queryKey: ['entity-fee-items', entityType, entityId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('fees.feeItemUpdateFailed'));
      logger.error('Failed to update fee item', {
        error: message,
        source: 'useEntityFeeItems.update',
        entityType,
        entityId,
      });
    },
  });

  // Mutation: Delete a fee item
  const deleteMutation = useMutation({
    mutationFn: async (feeItemId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('entity_fee_items')
        .delete()
        .eq('id', feeItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('fees.feeItemDeleted'));
      queryClient.invalidateQueries({ queryKey: ['entity-fee-items', entityType, entityId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('fees.feeItemDeleteFailed'));
      logger.error('Failed to delete fee item', {
        error: message,
        source: 'useEntityFeeItems.delete',
        entityType,
        entityId,
      });
    },
  });

  return {
    feeItems,
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createFeeItem: createMutation.mutate,
    updateFeeItem: updateMutation.mutate,
    deleteFeeItem: deleteMutation.mutate,
  };
}

/**
 * Calculate total fees from a list of fee items
 */
export function calculateFeesFromItems(
  priceCents: number,
  feeItems: FeeItem[]
): { total: number; breakdown: { label: string; amount: number }[] } {
  const breakdown: { label: string; amount: number }[] = [];
  let total = 0;

  for (const item of feeItems) {
    let amount = 0;
    if (item.fee_type === 'flat') {
      amount = item.fee_value; // Already in cents
    } else {
      // Percentage: fee_value is in basis points (hundredths of percent)
      amount = Math.round((priceCents * item.fee_value) / 10000);
    }
    breakdown.push({ label: item.label, amount });
    total += amount;
  }

  return { total, breakdown };
}
