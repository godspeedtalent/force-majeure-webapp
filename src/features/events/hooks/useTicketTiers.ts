import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price_cents: number;
  fee_flat_cents: number;
  fee_pct_bps: number;
  total_tickets: number;
  available_inventory: number;
  reserved_inventory: number;
  sold_inventory: number;
  tier_order: number;
  is_active: boolean;
  hide_until_previous_sold_out: boolean;
}

export const useTicketTiers = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('ticket_tiers' as any)
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('tier_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as TicketTier[];
    },
    enabled: !!eventId,
  });
};
