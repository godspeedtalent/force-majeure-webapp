import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';

export interface EventOrder {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    display_name: string | null;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unit_price_cents: number;
    unit_fee_cents: number;
    subtotal_cents: number;
    fees_cents: number;
    total_cents: number;
    ticket_tier: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}

export const useEventOrders = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['event-orders', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profile:profiles!user_id(
            id,
            display_name,
            full_name,
            email,
            avatar_url
          ),
          items:order_items(
            id,
            quantity,
            unit_price_cents,
            unit_fee_cents,
            subtotal_cents,
            fees_cents,
            total_cents,
            ticket_tier:ticket_tiers(
              id,
              name,
              description
            )
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as EventOrder[];
    },
    enabled: !!eventId,
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-orders', eventId] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });

  const refundOrder = useMutation({
    mutationFn: async (orderId: string) => {
      // TODO: Implement Stripe refund via edge function
      const { error } = await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-orders', eventId] });
      toast.success('Order refunded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to refund order: ${error.message}`);
    },
  });

  return {
    orders,
    isLoading,
    error,
    cancelOrder: cancelOrder.mutate,
    refundOrder: refundOrder.mutate,
  };
};
