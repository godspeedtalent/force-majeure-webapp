import { supabase } from '@/shared';
import { logger } from '@/shared';
export const orderService = {
    /**
     * Fetch orders for an event with profile and items
     */
    async getOrdersByEventId(eventId) {
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
          order_id,
          ticket_tier_id,
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
        if (error) {
            logger.error('Error fetching orders by event', {
                error: error.message,
                source: 'orderService',
                eventId,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Fetch orders for a user
     */
    async getOrdersByUserId(userId) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
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
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            logger.error('Error fetching orders by user', {
                error: error.message,
                source: 'orderService',
                userId,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Fetch a single order by ID with full details
     */
    async getOrderById(orderId) {
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
          order_id,
          ticket_tier_id,
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
            .eq('id', orderId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            logger.error('Error fetching order by ID', {
                error: error.message,
                source: 'orderService',
                orderId,
            });
            throw error;
        }
        return data;
    },
    /**
     * Get order count for an event
     */
    async getOrderCountByEventId(eventId) {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
        if (error) {
            logger.error('Error counting orders by event', {
                error: error.message,
                source: 'orderService',
                eventId,
            });
            return 0;
        }
        return count ?? 0;
    },
    /**
     * Get completed order count for an event
     */
    async getCompletedOrderCount(eventId) {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('status', 'completed');
        if (error) {
            logger.error('Error counting completed orders', {
                error: error.message,
                source: 'orderService',
                eventId,
            });
            return 0;
        }
        return count ?? 0;
    },
    /**
     * Create a new order
     */
    async createOrder(orderData) {
        const insertData = {
            ...orderData,
            currency: orderData.currency ?? 'usd',
            status: orderData.status ?? 'pending',
        };
        const { data, error } = await supabase
            .from('orders')
            .insert([insertData])
            .select()
            .single();
        if (error) {
            logger.error('Error creating order', {
                error: error.message,
                source: 'orderService',
                eventId: orderData.event_id,
            });
            throw error;
        }
        return data;
    },
    /**
     * Create order items
     */
    async createOrderItems(items) {
        if (items.length === 0) {
            return [];
        }
        const { data, error } = await supabase
            .from('order_items')
            .insert(items)
            .select();
        if (error) {
            logger.error('Error creating order items', {
                error: error.message,
                source: 'orderService',
                count: items.length,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Update order status
     */
    async updateOrderStatus(orderId, status) {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();
        if (error) {
            logger.error('Error updating order status', {
                error: error.message,
                source: 'orderService',
                orderId,
                status,
            });
            throw error;
        }
        return data;
    },
    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        return this.updateOrderStatus(orderId, 'cancelled');
    },
    /**
     * Mark order as refunded
     */
    async refundOrder(orderId) {
        return this.updateOrderStatus(orderId, 'refunded');
    },
    /**
     * Mark order as completed
     */
    async completeOrder(orderId) {
        return this.updateOrderStatus(orderId, 'completed');
    },
    /**
     * Get order revenue for an event
     */
    async getEventRevenue(eventId) {
        const { data, error } = await supabase
            .from('orders')
            .select('subtotal_cents, fees_cents, total_cents')
            .eq('event_id', eventId)
            .eq('status', 'completed');
        if (error) {
            logger.error('Error fetching event revenue', {
                error: error.message,
                source: 'orderService',
                eventId,
            });
            throw error;
        }
        const orders = data || [];
        return {
            total: orders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0),
            subtotal: orders.reduce((sum, o) => sum + (o.subtotal_cents ?? 0), 0),
            fees: orders.reduce((sum, o) => sum + (o.fees_cents ?? 0), 0),
            orderCount: orders.length,
        };
    },
    /**
     * Get orders with filters
     */
    async getOrdersWithFilters(filters) {
        let query = supabase
            .from('orders')
            .select(`
        *,
        profile:profiles!user_id(
          id,
          display_name,
          full_name,
          email
        ),
        items:order_items(
          id,
          quantity,
          total_cents,
          ticket_tier:ticket_tiers(name)
        )
      `);
        if (filters.event_id) {
            query = query.eq('event_id', filters.event_id);
        }
        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            logger.error('Error fetching orders with filters', {
                error: error.message,
                source: 'orderService',
                filters,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Check if user has an order for an event
     */
    async userHasOrderForEvent(userId, eventId) {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .in('status', ['completed', 'pending']);
        if (error) {
            logger.error('Error checking user order', {
                error: error.message,
                source: 'orderService',
                userId,
                eventId,
            });
            return false;
        }
        return (count ?? 0) > 0;
    },
};
