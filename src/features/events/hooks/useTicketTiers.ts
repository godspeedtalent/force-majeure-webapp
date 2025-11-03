import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { TicketTier } from '../types';

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
