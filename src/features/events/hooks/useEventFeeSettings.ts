import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';

export interface EventFeeSettings {
  use_default_fees: boolean;
  fee_flat_cents: number;
  fee_pct_bps: number;
}

/**
 * Hook for managing event-level fee settings
 *
 * Controls the use_default_fees flag and custom fee values
 */
export function useEventFeeSettings(eventId: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Query: Get current fee settings
  // Note: These columns are added by migration 20260121400000_add_fee_inheritance_flags.sql
  // Using type assertion until the database types are regenerated
  const { data: settings, isLoading } = useQuery<EventFeeSettings>({
    queryKey: ['event-fee-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Type assertion for columns added by migration
      const eventData = data as unknown as {
        use_default_fees?: boolean;
        fee_flat_cents?: number;
        fee_pct_bps?: number;
      };

      return {
        use_default_fees: eventData?.use_default_fees ?? true,
        fee_flat_cents: eventData?.fee_flat_cents ?? 0,
        fee_pct_bps: eventData?.fee_pct_bps ?? 0,
      };
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation: Update fee settings
  // Note: These columns are added by migration 20260121400000_add_fee_inheritance_flags.sql
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EventFeeSettings>) => {
      const { error } = await supabase
        .from('events')
        .update(updates as Record<string, unknown>)
        .eq('id', eventId);

      if (error) throw error;
      return updates;
    },
    onSuccess: () => {
      toast.success(t('events.feeSettingsUpdated'));
      queryClient.invalidateQueries({ queryKey: ['event-fee-settings', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('events.feeSettingsUpdateFailed'));
      logger.error('Failed to update fee settings', {
        error: message,
        source: 'useEventFeeSettings.update',
        event_id: eventId,
      });
    },
  });

  return {
    settings: settings ?? { use_default_fees: true, fee_flat_cents: 0, fee_pct_bps: 0 },
    isLoading,
    isSaving: updateMutation.isPending,
    updateSettings: updateMutation.mutate,
  };
}
