import { supabase } from '@/shared';
import { logger } from '@/shared';

/**
 * Order Service
 *
 * Centralized service for all order-related data operations.
 * Consolidates duplicate Supabase queries for orders table.
 */

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded' | 'failed';

export interface OrderProfile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_tier_id: string;
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents: number;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  ticket_tier?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface Order {
  id: string;
  event_id: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  currency: string;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  created_at: string;
  updated_at: string;
  profile?: OrderProfile;
  items?: OrderItem[];
}

export interface CreateOrderData {
  event_id: string;
  user_id: string;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  currency?: string;
  status?: OrderStatus;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
}

export interface CreateOrderItemData {
  order_id: string;
  ticket_tier_id: string;
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents: number;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
}

export interface OrderFilters {
  event_id?: string;
  user_id?: string;
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
}

export const orderService = {
  /**
   * Fetch orders for an event with profile and items
   */
  async getOrdersByEventId(eventId: string): Promise<Order[]> {
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

    return (data || []) as unknown as Order[];
  },

  /**
   * Fetch orders for a user
   */
  async getOrdersByUserId(userId: string): Promise<Order[]> {
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

    return (data || []) as unknown as Order[];
  },

  /**
   * Fetch a single order by ID with full details
   */
  async getOrderById(orderId: string): Promise<Order | null> {
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

    return data as unknown as Order;
  },

  /**
   * Get order count for an event
   */
  async getOrderCountByEventId(eventId: string): Promise<number> {
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
  async getCompletedOrderCount(eventId: string): Promise<number> {
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
  async createOrder(orderData: CreateOrderData): Promise<Order> {
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

    return data as unknown as Order;
  },

  /**
   * Create order items
   */
  async createOrderItems(items: CreateOrderItemData[]): Promise<OrderItem[]> {
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

    return (data || []) as OrderItem[];
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
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

    return data as unknown as Order;
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'cancelled');
  },

  /**
   * Mark order as refunded
   */
  async refundOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'refunded');
  },

  /**
   * Mark order as completed
   */
  async completeOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'completed');
  },

  /**
   * Get order revenue for an event
   */
  async getEventRevenue(eventId: string): Promise<{
    total: number;
    subtotal: number;
    fees: number;
    orderCount: number;
  }> {
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
  async getOrdersWithFilters(filters: OrderFilters): Promise<Order[]> {
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

    return (data || []) as unknown as Order[];
  },

  /**
   * Check if user has an order for an event
   */
  async userHasOrderForEvent(userId: string, eventId: string): Promise<boolean> {
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
