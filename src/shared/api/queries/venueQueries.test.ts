import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/utils/testUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useVenueById,
  useVenues,
  useVenuesWithFilters,
  useSearchVenues,
  useVenueCapacity,
  useVenueEventCount,
  useVenueHasEvents,
  useVenueCities,
  useVenuesByCity,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue,
  venueKeys,
} from './venueQueries';

// Mock venueService
vi.mock('@/features/venues/services/venueService', () => ({
  venueService: {
    getVenueById: vi.fn(),
    getVenues: vi.fn(),
    getVenuesWithFilters: vi.fn(),
    searchVenues: vi.fn(),
    getVenueCapacity: vi.fn(),
    getEventCount: vi.fn(),
    hasEvents: vi.fn(),
    getUniqueCities: vi.fn(),
    getVenuesByCity: vi.fn(),
    createVenue: vi.fn(),
    updateVenue: vi.fn(),
    deleteVenue: vi.fn(),
  },
}));

import { venueService } from '@/features/venues/services/venueService';

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// Create a wrapper that exposes queryClient for testing cache invalidation
function createWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return { wrapper, queryClient };
}

describe('venueQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('venueKeys', () => {
    it('should generate correct query keys', () => {
      expect(venueKeys.all).toEqual(['venues']);
      expect(venueKeys.lists()).toEqual(['venues', 'list']);
      expect(venueKeys.list({ city: 'Chicago' })).toEqual(['venues', 'list', { city: 'Chicago' }]);
      expect(venueKeys.details()).toEqual(['venues', 'detail']);
      expect(venueKeys.detail('123')).toEqual(['venues', 'detail', '123']);
      expect(venueKeys.capacity('123')).toEqual(['venues', 'capacity', '123']);
      expect(venueKeys.eventCount('123')).toEqual(['venues', 'eventCount', '123']);
      expect(venueKeys.cities()).toEqual(['venues', 'cities']);
      expect(venueKeys.search('test')).toEqual(['venues', 'search', 'test']);
    });
  });

  describe('useVenueById', () => {
    it('should fetch venue by ID', async () => {
      const mockVenue = { id: '1', name: 'Test Venue', city: 'Chicago' };
      vi.mocked(venueService.getVenueById).mockResolvedValue(mockVenue as any);

      const { result } = renderHook(() => useVenueById('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockVenue);
      expect(venueService.getVenueById).toHaveBeenCalledWith('1');
    });

    it('should not fetch when venueId is undefined', () => {
      const { result } = renderHook(() => useVenueById(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(venueService.getVenueById).not.toHaveBeenCalled();
    });

    it('should respect enabled option', () => {
      const { result } = renderHook(() => useVenueById('1', { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(venueService.getVenueById).not.toHaveBeenCalled();
    });
  });

  describe('useVenues', () => {
    it('should fetch all venues', async () => {
      const mockVenues = [
        { id: '1', name: 'Venue A' },
        { id: '2', name: 'Venue B' },
      ];
      vi.mocked(venueService.getVenues).mockResolvedValue(mockVenues as any);

      const { result } = renderHook(() => useVenues(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockVenues);
    });
  });

  describe('useVenuesWithFilters', () => {
    it('should fetch venues with filters', async () => {
      const mockVenues = [{ id: '1', name: 'Chicago Venue', city: 'Chicago' }];
      vi.mocked(venueService.getVenuesWithFilters).mockResolvedValue(mockVenues as any);

      const filters = { city: 'Chicago', minCapacity: 100 };
      const { result } = renderHook(() => useVenuesWithFilters(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockVenues);
      expect(venueService.getVenuesWithFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe('useSearchVenues', () => {
    it('should search venues when query is not empty', async () => {
      const mockVenues = [{ id: '1', name: 'Test Club' }];
      vi.mocked(venueService.searchVenues).mockResolvedValue(mockVenues as any);

      const { result } = renderHook(() => useSearchVenues('Test'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockVenues);
      expect(venueService.searchVenues).toHaveBeenCalledWith('Test');
    });

    it('should not search when query is empty', () => {
      const { result } = renderHook(() => useSearchVenues(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(venueService.searchVenues).not.toHaveBeenCalled();
    });

    it('should not search when query is whitespace', () => {
      const { result } = renderHook(() => useSearchVenues('   '), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(venueService.searchVenues).not.toHaveBeenCalled();
    });
  });

  describe('useVenueCapacity', () => {
    it('should fetch venue capacity', async () => {
      vi.mocked(venueService.getVenueCapacity).mockResolvedValue(500);

      const { result } = renderHook(() => useVenueCapacity('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(500);
    });

    it('should not fetch when venueId is undefined', () => {
      const { result } = renderHook(() => useVenueCapacity(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(venueService.getVenueCapacity).not.toHaveBeenCalled();
    });
  });

  describe('useVenueEventCount', () => {
    it('should fetch event count', async () => {
      vi.mocked(venueService.getEventCount).mockResolvedValue(10);

      const { result } = renderHook(() => useVenueEventCount('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(10);
    });
  });

  describe('useVenueHasEvents', () => {
    it('should return true when venue has events', async () => {
      vi.mocked(venueService.hasEvents).mockResolvedValue(true);

      const { result } = renderHook(() => useVenueHasEvents('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(true);
    });

    it('should return false when venue has no events', async () => {
      vi.mocked(venueService.hasEvents).mockResolvedValue(false);

      const { result } = renderHook(() => useVenueHasEvents('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(false);
    });
  });

  describe('useVenueCities', () => {
    it('should fetch unique cities', async () => {
      const mockCities = ['Chicago', 'New York', 'Los Angeles'];
      vi.mocked(venueService.getUniqueCities).mockResolvedValue(mockCities);

      const { result } = renderHook(() => useVenueCities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCities);
    });
  });

  describe('useVenuesByCity', () => {
    it('should fetch venues by city', async () => {
      const mockVenues = [{ id: '1', name: 'Chicago Venue', city: 'Chicago' }];
      vi.mocked(venueService.getVenuesByCity).mockResolvedValue(mockVenues as any);

      const { result } = renderHook(() => useVenuesByCity('Chicago'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockVenues);
      expect(venueService.getVenuesByCity).toHaveBeenCalledWith('Chicago');
    });

    it('should not fetch when city is undefined', () => {
      const { result } = renderHook(() => useVenuesByCity(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(venueService.getVenuesByCity).not.toHaveBeenCalled();
    });
  });

  describe('useCreateVenue', () => {
    it('should create venue and invalidate queries', async () => {
      const newVenue = { name: 'New Venue', address: '123 Main', city: 'Chicago' };
      const mockResult = { id: '1', ...newVenue };
      vi.mocked(venueService.createVenue).mockResolvedValue(mockResult as any);

      const { wrapper, queryClient } = createWrapperWithClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateVenue(), { wrapper });

      await result.current.mutateAsync(newVenue);

      expect(venueService.createVenue).toHaveBeenCalledWith(newVenue);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: venueKeys.lists() });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: venueKeys.cities() });
    });
  });

  describe('useUpdateVenue', () => {
    it('should update venue and invalidate queries', async () => {
      const updateData = { name: 'Updated Venue' };
      const mockResult = { id: '1', ...updateData };
      vi.mocked(venueService.updateVenue).mockResolvedValue(mockResult as any);

      const { wrapper, queryClient } = createWrapperWithClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateVenue(), { wrapper });

      await result.current.mutateAsync({ id: '1', data: updateData });

      expect(venueService.updateVenue).toHaveBeenCalledWith('1', updateData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: venueKeys.detail('1') });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: venueKeys.lists() });
    });
  });

  describe('useDeleteVenue', () => {
    it('should delete venue and invalidate queries', async () => {
      vi.mocked(venueService.deleteVenue).mockResolvedValue();

      const { wrapper, queryClient } = createWrapperWithClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useDeleteVenue(), { wrapper });

      await result.current.mutateAsync('1');

      expect(venueService.deleteVenue).toHaveBeenCalledWith('1');
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: venueKeys.detail('1') });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: venueKeys.lists() });
    });
  });

  describe('error handling', () => {
    it('should handle query errors', async () => {
      const mockError = new Error('Failed to fetch');
      vi.mocked(venueService.getVenueById).mockRejectedValue(mockError);

      const { result } = renderHook(() => useVenueById('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(mockError);
    });

    it('should handle mutation errors', async () => {
      const mockError = new Error('Create failed');
      vi.mocked(venueService.createVenue).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateVenue(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ name: 'Test', address_line_1: '123', city: 'City' })
      ).rejects.toThrow('Create failed');
    });
  });
});
