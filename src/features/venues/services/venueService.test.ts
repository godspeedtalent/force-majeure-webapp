import { describe, it, expect, vi, beforeEach } from 'vitest';
import { venueService } from './venueService';

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

describe('venueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVenues', () => {
    it('should fetch all venues ordered by name', async () => {
      const mockVenues = [
        { id: '1', name: 'Club A', city: 'Chicago' },
        { id: '2', name: 'Venue B', city: 'New York' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenues();

      expect(supabase.from).toHaveBeenCalledWith('venues');
      expect(mockBuilder.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(mockVenues);
    });

    it('should return empty array when no venues', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenues();

      expect(result).toEqual([]);
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Database error' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(venueService.getVenues()).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error fetching venues', {
        error: 'Database error',
        source: 'venueService',
      });
    });
  });

  describe('getVenueById', () => {
    it('should fetch a single venue', async () => {
      const mockVenue = { id: '1', name: 'Test Venue', city: 'Chicago' };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueById('1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockVenue);
    });

    it('should return null when venue not found', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('searchVenues', () => {
    it('should search venues by name', async () => {
      const mockVenues = [{ id: '1', name: 'Test Club' }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.searchVenues('Test');

      expect(mockBuilder.ilike).toHaveBeenCalledWith('name', '%Test%');
      expect(result).toEqual(mockVenues);
    });

    it('should return all venues for empty query', async () => {
      const mockVenues = [{ id: '1', name: 'Venue A' }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.searchVenues('   ');

      expect(result).toEqual(mockVenues);
    });
  });

  describe('getVenuesByCity', () => {
    it('should fetch venues by city', async () => {
      const mockVenues = [{ id: '1', name: 'Chicago Venue', city: 'Chicago' }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenuesByCity('Chicago');

      expect(mockBuilder.eq).toHaveBeenCalledWith('city', 'Chicago');
      expect(result).toEqual(mockVenues);
    });
  });

  describe('getVenueName', () => {
    it('should fetch venue name', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { name: 'Test Venue' }, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueName('1');

      expect(result).toBe('Test Venue');
    });

    it('should return null when venue not found', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getVenueCapacity', () => {
    it('should fetch venue capacity', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { capacity: 500 }, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueCapacity('1');

      expect(result).toBe(500);
    });

    it('should return default capacity on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueCapacity('1');

      expect(result).toBe(100);
    });

    it('should return default when capacity is null', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { capacity: null }, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenueCapacity('1');

      expect(result).toBe(100);
    });
  });

  describe('createVenue', () => {
    it('should create a venue', async () => {
      const newVenue = { name: 'New Venue', address: '123 Main', city: 'Chicago' };
      const mockVenue = { id: '1', ...newVenue };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.createVenue(newVenue);

      expect(mockBuilder.insert).toHaveBeenCalledWith([newVenue]);
      expect(result).toEqual(mockVenue);
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
        venueService.createVenue({ name: 'Test', address_line_1: '123', city: 'City' })
      ).rejects.toEqual(mockError);
    });
  });

  describe('updateVenue', () => {
    it('should update a venue', async () => {
      const mockVenue = { id: '1', name: 'Updated Venue' };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVenue, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.updateVenue('1', { name: 'Updated Venue' });

      expect(mockBuilder.update).toHaveBeenCalledWith({ name: 'Updated Venue' });
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockVenue);
    });
  });

  describe('deleteVenue', () => {
    it('should delete a venue', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await venueService.deleteVenue('1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Delete failed' };
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(venueService.deleteVenue('1')).rejects.toEqual(mockError);
    });
  });

  describe('hasEvents', () => {
    it('should return true when venue has events', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.hasEvents('1');

      expect(result).toBe(true);
    });

    it('should return false when venue has no events', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.hasEvents('1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.hasEvents('1');

      expect(result).toBe(false);
    });
  });

  describe('getEventCount', () => {
    it('should return event count', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getEventCount('1');

      expect(result).toBe(10);
    });

    it('should return 0 on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getEventCount('1');

      expect(result).toBe(0);
    });
  });

  describe('getVenuesWithFilters', () => {
    it('should apply city filter', async () => {
      const mockVenues = [{ id: '1', city: 'Chicago' }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenuesWithFilters({ city: 'Chicago' });

      expect(mockBuilder.eq).toHaveBeenCalledWith('city', 'Chicago');
      expect(result).toEqual(mockVenues);
    });

    it('should apply capacity filters', async () => {
      const mockVenues = [{ id: '1', capacity: 300 }];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getVenuesWithFilters({
        minCapacity: 100,
        maxCapacity: 500,
      });

      expect(mockBuilder.gte).toHaveBeenCalledWith('capacity', 100);
      expect(mockBuilder.lte).toHaveBeenCalledWith('capacity', 500);
      expect(result).toEqual(mockVenues);
    });
  });

  describe('getUniqueCities', () => {
    it('should return unique cities', async () => {
      const mockData = [
        { city: 'Chicago' },
        { city: 'New York' },
        { city: 'Chicago' },
        { city: 'Los Angeles' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getUniqueCities();

      expect(result).toEqual(['Chicago', 'New York', 'Los Angeles']);
    });

    it('should filter out null/undefined cities', async () => {
      const mockData = [
        { city: 'Chicago' },
        { city: null },
        { city: '' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await venueService.getUniqueCities();

      expect(result).toEqual(['Chicago']);
    });
  });
});
