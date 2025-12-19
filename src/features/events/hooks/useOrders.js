import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
export const useOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          event:events(title, date, time),
          items:order_items(
            id,
            quantity,
            unit_price_cents,
            subtotal_cents,
            ticket_tier:ticket_tiers(name)
          )
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
};
export const useOrder = (orderId) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            if (!orderId)
                return null;
            const { data, error } = await supabase
                .from('orders')
                .select(`
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
        `)
                .eq('id', orderId)
                .single();
            if (error)
                throw error;
            return data;
        },
        enabled: !!orderId,
    });
};
