import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';

/**
 * Hook for managing max tickets per order setting on an event
 */
export function useEventMaxTicketsPerOrder(eventId: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Query: Get current max_tickets_per_order value
  const {
    data: maxTicketsPerOrder = 100,
    isLoading,
  } = useQuery<number>({
    queryKey: ['event-max-tickets-per-order', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('max_tickets_per_order')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      const eventData = data as { max_tickets_per_order?: number | null };
      return eventData.max_tickets_per_order ?? 100; // Default to 100
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation: Update max_tickets_per_order
  const updateMutation = useMutation({
    mutationFn: async (newValue: number) => {
      // Cast needed until Supabase types are regenerated with max_tickets_per_order column
      const { error } = await supabase
        .from('events')
        .update({ max_tickets_per_order: newValue } as Record<string, unknown>)
        .eq('id', eventId);

      if (error) throw error;

      return newValue;
    },
    onSuccess: () => {
      toast.success(t('events.maxTicketsPerOrderUpdated'));
      queryClient.invalidateQueries({ queryKey: ['event-max-tickets-per-order', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('events.maxTicketsPerOrderUpdateFailed'));
      logger.error('Failed to update max_tickets_per_order', {
        error: message,
        source: 'useEventMaxTicketsPerOrder.update',
        event_id: eventId,
      });
    },
  });

  // Update max tickets per order
  const updateMaxTicketsPerOrder = (value: number) => {
    // Validate value is within reasonable bounds
    if (value < 1 || value > 10000) {
      toast.error(t('events.maxTicketsPerOrderInvalidRange'));
      return;
    }
    updateMutation.mutate(value);
  };

  return {
    maxTicketsPerOrder,
    isLoading,
    isSaving: updateMutation.isPending,
    updateMaxTicketsPerOrder,
  };
}
