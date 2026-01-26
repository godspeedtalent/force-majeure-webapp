import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ticketTierService } from './ticketTierService';

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


describe('ticketTierService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTiersByEventId', () => {
    it('should fetch tiers for an event', async () => {
      const mockTiers = [
        { id: '1', name: 'GA', price_cents: 2000, event_id: 'event-1', tier_order: 0 },
        { id: '2', name: 'VIP', price_cents: 5000, event_id: 'event-1', tier_order: 1 },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getTiersByEventId('event-1');

      expect(supabase.from).toHaveBeenCalledWith('ticket_tiers');
      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(mockBuilder.order).toHaveBeenCalledWith('tier_order', { ascending: true });
      expect(result).toEqual(mockTiers);
    });

    it('should return empty array when no tiers exist', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getTiersByEventId('event-1');

      expect(result).toEqual([]);
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Database error', code: '42P01' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(ticketTierService.getTiersByEventId('event-1')).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error fetching ticket tiers', {
        error: 'Database error',
        source: 'ticketTierService',
        eventId: 'event-1',
      });
    });
  });

  describe('getActiveTiersByEventId', () => {
    it('should fetch only active tiers', async () => {
      const mockTiers = [
        { id: '1', name: 'GA', is_active: true },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getActiveTiersByEventId('event-1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(mockBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockTiers);
    });
  });

  describe('getTierById', () => {
    it('should fetch a single tier', async () => {
      const mockTier = { id: '1', name: 'GA', price_cents: 2000 };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTier, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getTierById('tier-1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'tier-1');
      expect(result).toEqual(mockTier);
    });

    it('should return null when tier not found', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getTierById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTier', () => {
    it('should create a tier with defaults', async () => {
      const mockTier = {
        id: '1',
        name: 'GA',
        price_cents: 2000,
        event_id: 'event-1',
        is_active: true,
        tier_order: 0,
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTier, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.createTier({
        event_id: 'event-1',
        name: 'GA',
        price_cents: 2000,
      });

      expect(mockBuilder.insert).toHaveBeenCalledWith([{
        event_id: 'event-1',
        name: 'GA',
        price_cents: 2000,
        is_active: true,
        tier_order: 0,
      }]);
      expect(result).toEqual(mockTier);
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Insert failed' };
      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(ticketTierService.createTier({
        event_id: 'event-1',
        name: 'GA',
        price_cents: 2000,
      })).rejects.toEqual(mockError);
    });
  });

  describe('createTiers', () => {
    it('should create multiple tiers', async () => {
      const mockTiers = [
        { id: '1', name: 'GA', tier_order: 0 },
        { id: '2', name: 'VIP', tier_order: 1 },
      ];

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.createTiers([
        { event_id: 'event-1', name: 'GA', price_cents: 2000 },
        { event_id: 'event-1', name: 'VIP', price_cents: 5000 },
      ]);

      expect(result).toEqual(mockTiers);
    });

    it('should return empty array for empty input', async () => {
      const result = await ticketTierService.createTiers([]);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('updateTier', () => {
    it('should update a tier', async () => {
      const mockTier = { id: '1', name: 'Updated GA', price_cents: 2500 };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTier, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.updateTier('tier-1', { name: 'Updated GA' });

      expect(mockBuilder.update).toHaveBeenCalledWith({ name: 'Updated GA' });
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'tier-1');
      expect(result).toEqual(mockTier);
    });
  });

  describe('deleteTier', () => {
    it('should delete a tier', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await ticketTierService.deleteTier('tier-1');

      expect(supabase.from).toHaveBeenCalledWith('ticket_tiers');
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'tier-1');
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Delete failed' };
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(ticketTierService.deleteTier('tier-1')).rejects.toEqual(mockError);
    });
  });

  describe('deleteTiersByEventId', () => {
    it('should delete all tiers for an event', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await ticketTierService.deleteTiersByEventId('event-1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
    });
  });

  describe('setTierActive', () => {
    it('should update tier active status', async () => {
      const mockTier = { id: '1', is_active: false };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTier, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.setTierActive('tier-1', false);

      expect(mockBuilder.update).toHaveBeenCalledWith({ is_active: false });
      expect(result).toEqual(mockTier);
    });
  });

  describe('getTierInventory', () => {
    it('should return inventory summary', async () => {
      const mockData = {
        total_tickets: 100,
        quantity_available: 80,
        available_inventory: 70,
        reserved_inventory: 10,
        sold_inventory: 20,
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getTierInventory('tier-1');

      expect(result).toEqual({
        total: 100,
        available: 70,
        reserved: 10,
        sold: 20,
      });
    });

    it('should handle null values with defaults', async () => {
      const mockData = {
        total_tickets: null,
        quantity_available: null,
        available_inventory: null,
        reserved_inventory: null,
        sold_inventory: null,
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.getTierInventory('tier-1');

      expect(result).toEqual({
        total: 0,
        available: 0,
        reserved: 0,
        sold: 0,
      });
    });
  });

  describe('replaceTiers', () => {
    it('should delete and recreate tiers', async () => {
      const mockNewTiers = [
        { id: 'new-1', name: 'New GA', event_id: 'event-1' },
      ];

      // Mock for delete
      const deleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock for insert
      const insertBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockNewTiers, error: null }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? (deleteBuilder as any) : (insertBuilder as any);
      });

      const result = await ticketTierService.replaceTiers('event-1', [
        { name: 'New GA', price_cents: 2000 },
      ]);

      expect(result).toEqual(mockNewTiers);
    });

    it('should only delete when no new tiers provided', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.replaceTiers('event-1', []);

      expect(result).toEqual([]);
      expect(mockBuilder.delete).toHaveBeenCalled();
    });
  });

  describe('upsertTiers', () => {
    it('should upsert tiers', async () => {
      const mockTiers = [
        { id: '1', name: 'Updated GA', event_id: 'event-1' },
      ];

      const mockBuilder = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await ticketTierService.upsertTiers('event-1', [
        { id: '1', name: 'Updated GA' },
      ]);

      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        [{ id: '1', name: 'Updated GA', event_id: 'event-1', tier_order: 0 }],
        { onConflict: 'id' }
      );
      expect(result).toEqual(mockTiers);
    });

    it('should return empty array for empty input', async () => {
      const result = await ticketTierService.upsertTiers('event-1', []);
      expect(result).toEqual([]);
    });
  });
});
