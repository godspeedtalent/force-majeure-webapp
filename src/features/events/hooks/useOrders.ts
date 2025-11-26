import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';

export interface Order {
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
}

export interface OrderWithDetails extends Order {
  event: {
    title: string;
    date: string;
    time: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unit_price_cents: number;
    subtotal_cents: number;
    ticket_tier: {
      name: string;
    };
  }>;
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error} = await supabase
        .from('orders')
        .select(
          `
          *,
          event:events(title, date, time),
          items:order_items(
            id,
            quantity,
            unit_price_cents,
            subtotal_cents,
            ticket_tier:ticket_tiers(name)
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as OrderWithDetails[];
    },
  });
};

export const useOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          event:events(title, date, time, venue:venues(name, address:address_line_1, city)),
          items:order_items(
            id,
            quantity,
            unit_price_cents,
            unit_fee_cents,
            subtotal_cents,
            fees_cents,
            total_cents,
            ticket_tier:ticket_tiers(name, description)
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as unknown as OrderWithDetails;
    },
    enabled: !!orderId,
  });
};
