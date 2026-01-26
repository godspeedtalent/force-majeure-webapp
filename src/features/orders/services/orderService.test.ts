import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from './orderService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    error: vi.fn(),
    createNamespace: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrdersByEventId', () => {
    it('should fetch orders for an event', async () => {
      const mockOrders = [
        { id: '1', event_id: 'event-1', status: 'completed', total_cents: 5000 },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrdersByEventId('event-1');

      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when no orders', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrdersByEventId('event-1');

      expect(result).toEqual([]);
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Database error' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(orderService.getOrdersByEventId('event-1')).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getOrdersByUserId', () => {
    it('should fetch orders for a user', async () => {
      const mockOrders = [
        { id: '1', user_id: 'user-1', status: 'completed' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrdersByUserId('user-1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should fetch a single order', async () => {
      const mockOrder = { id: '1', status: 'completed' };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should return null when order not found', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrderById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getOrderCountByEventId', () => {
    it('should return order count', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrderCountByEventId('event-1');

      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(mockBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(result).toBe(10);
    });

    it('should return 0 on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrderCountByEventId('event-1');

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCompletedOrderCount', () => {
    it('should return completed order count', async () => {
      // Mock chain: select() -> eq(event_id) -> eq(status) -> resolves
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          // After the second eq() call (status), return the promise
          if (field === 'status') {
            return Promise.resolve({ count: 5, error: null });
          }
          return mockBuilder;
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getCompletedOrderCount('event-1');

      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(mockBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'completed');
      expect(result).toBe(5);
    });

    it('should return 0 on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'status') {
            return Promise.resolve({ count: null, error: { message: 'Error' } });
          }
          return mockBuilder;
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getCompletedOrderCount('event-1');

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createOrder', () => {
    it('should create an order with defaults', async () => {
      const mockOrder = {
        id: '1',
        event_id: 'event-1',
        user_id: 'user-1',
        status: 'pending',
        currency: 'usd',
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.createOrder({
        event_id: 'event-1',
        user_id: 'user-1',
        subtotal_cents: 4000,
        fees_cents: 500,
        total_cents: 4500,
      });

      expect(mockBuilder.insert).toHaveBeenCalledWith([{
        event_id: 'event-1',
        user_id: 'user-1',
        subtotal_cents: 4000,
        fees_cents: 500,
        total_cents: 4500,
        currency: 'usd',
        status: 'pending',
      }]);
      expect(result).toEqual(mockOrder);
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Insert failed' };
      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(
        orderService.createOrder({
          event_id: 'event-1',
          user_id: 'user-1',
          subtotal_cents: 0,
          fees_cents: 0,
          total_cents: 0,
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('createOrderItems', () => {
    it('should create order items', async () => {
      const mockItems = [{ id: '1', order_id: 'order-1', quantity: 2 }];

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.createOrderItems([{
        order_id: 'order-1',
        ticket_tier_id: 'tier-1',
        quantity: 2,
        unit_price_cents: 2000,
        unit_fee_cents: 250,
        subtotal_cents: 4000,
        fees_cents: 500,
        total_cents: 4500,
      }]);

      expect(supabase.from).toHaveBeenCalledWith('order_items');
      expect(result).toEqual(mockItems);
    });

    it('should return empty array for empty input', async () => {
      const result = await orderService.createOrderItems([]);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = { id: '1', status: 'completed' };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.updateOrderStatus('order-1', 'completed');

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const mockOrder = { id: '1', status: 'cancelled' };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.cancelOrder('order-1');

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'cancelled' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('refundOrder', () => {
    it('should refund an order', async () => {
      const mockOrder = { id: '1', status: 'refunded' };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.refundOrder('order-1');

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'refunded' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('completeOrder', () => {
    it('should complete an order', async () => {
      const mockOrder = { id: '1', status: 'completed' };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.completeOrder('order-1');

      expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getEventRevenue', () => {
    it('should calculate event revenue', async () => {
      const mockOrders = [
        { subtotal_cents: 4000, fees_cents: 500, total_cents: 4500 },
        { subtotal_cents: 8000, fees_cents: 1000, total_cents: 9000 },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // First eq returns this, second eq resolves with data
      let eqCallCount = 0;
      mockBuilder.eq = vi.fn().mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount === 2) {
          return Promise.resolve({ data: mockOrders, error: null });
        }
        return mockBuilder;
      });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getEventRevenue('event-1');

      expect(result).toEqual({
        total: 13500,
        subtotal: 12000,
        fees: 1500,
        orderCount: 2,
      });
    });

    it('should return zeros for no orders', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCallCount = 0;
      mockBuilder.eq = vi.fn().mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount === 2) {
          return Promise.resolve({ data: [], error: null });
        }
        return mockBuilder;
      });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getEventRevenue('event-1');

      expect(result).toEqual({
        total: 0,
        subtotal: 0,
        fees: 0,
        orderCount: 0,
      });
    });
  });

  describe('getOrdersWithFilters', () => {
    it('should apply event_id filter', async () => {
      const mockOrders = [{ id: '1', event_id: 'event-1' }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.getOrdersWithFilters({ event_id: 'event-1' });

      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(result).toEqual(mockOrders);
    });

    it('should apply date filters', async () => {
      const mockOrders = [{ id: '1' }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await orderService.getOrdersWithFilters({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      });

      expect(mockBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockBuilder.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
    });
  });

  describe('userHasOrderForEvent', () => {
    it('should return true when user has order', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 1, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.userHasOrderForEvent('user-1', 'event-1');

      expect(result).toBe(true);
    });

    it('should return false when user has no order', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.userHasOrderForEvent('user-1', 'event-1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await orderService.userHasOrderForEvent('user-1', 'event-1');

      expect(result).toBe(false);
    });
  });
});
