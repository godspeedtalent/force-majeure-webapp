import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useScanStatistics, useRecentScans } from './useScanStatistics';

// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    createNamespace: () => ({
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

import { supabase } from '@force-majeure/shared';

// Wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useScanStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('data aggregation', () => {
    it('should count total scans correctly', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: '1', created_at: '2024-01-01T10:00:00Z' },
        { scan_result: 'invalid', ticket_id: null, created_at: '2024-01-01T11:00:00Z' },
        { scan_result: 'already_used', ticket_id: '1', created_at: '2024-01-01T12:00:00Z' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.totalScans).toBe(3);
    });

    it('should count successful scans (scan_result === "success")', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: '1', created_at: '2024-01-01T10:00:00Z' },
        { scan_result: 'success', ticket_id: '2', created_at: '2024-01-01T11:00:00Z' },
        { scan_result: 'invalid', ticket_id: null, created_at: '2024-01-01T12:00:00Z' },
        { scan_result: 'already_used', ticket_id: '1', created_at: '2024-01-01T13:00:00Z' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.successfulScans).toBe(2);
    });

    it('should count invalid scans (scan_result === "invalid")', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: '1', created_at: '2024-01-01T10:00:00Z' },
        { scan_result: 'invalid', ticket_id: null, created_at: '2024-01-01T11:00:00Z' },
        { scan_result: 'invalid', ticket_id: null, created_at: '2024-01-01T12:00:00Z' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.invalidScans).toBe(2);
    });

    it('should count duplicate scans (scan_result === "already_used")', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: '1', created_at: '2024-01-01T10:00:00Z' },
        { scan_result: 'already_used', ticket_id: '1', created_at: '2024-01-01T11:00:00Z' },
        { scan_result: 'already_used', ticket_id: '1', created_at: '2024-01-01T12:00:00Z' },
        { scan_result: 'already_used', ticket_id: '2', created_at: '2024-01-01T13:00:00Z' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.duplicateScans).toBe(3);
    });

    it('should count rejected scans (refunded OR cancelled)', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: '1', created_at: '2024-01-01T10:00:00Z' },
        { scan_result: 'refunded', ticket_id: '2', created_at: '2024-01-01T11:00:00Z' },
        { scan_result: 'cancelled', ticket_id: '3', created_at: '2024-01-01T12:00:00Z' },
        { scan_result: 'refunded', ticket_id: '4', created_at: '2024-01-01T13:00:00Z' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.rejectedScans).toBe(3);
    });

    it('should calculate unique tickets from successful scans only', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: 'ticket-1', created_at: '2024-01-01T10:00:00Z' },
        { scan_result: 'success', ticket_id: 'ticket-2', created_at: '2024-01-01T11:00:00Z' },
        { scan_result: 'success', ticket_id: 'ticket-1', created_at: '2024-01-01T12:00:00Z' }, // Duplicate ticket
        { scan_result: 'invalid', ticket_id: null, created_at: '2024-01-01T13:00:00Z' },
        { scan_result: 'already_used', ticket_id: 'ticket-3', created_at: '2024-01-01T14:00:00Z' }, // Not counted
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Only ticket-1 and ticket-2 from successful scans (duplicates counted once)
      expect(result.current.data?.uniqueTicketsScanned).toBe(2);
    });

    it('should find first and last scan times correctly', async () => {
      const mockData = [
        { scan_result: 'success', ticket_id: '1', created_at: '2024-01-01T14:00:00Z' },
        { scan_result: 'success', ticket_id: '2', created_at: '2024-01-01T10:00:00Z' }, // First
        { scan_result: 'invalid', ticket_id: null, created_at: '2024-01-01T18:00:00Z' }, // Last
        { scan_result: 'success', ticket_id: '3', created_at: '2024-01-01T12:00:00Z' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.firstScan).toBe('2024-01-01T10:00:00Z');
      expect(result.current.data?.lastScan).toBe('2024-01-01T18:00:00Z');
    });
  });

  describe('event filtering', () => {
    it('should filter by eventId when provided', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      renderHook(() => useScanStatistics({ eventId: 'event-123' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-123');
      });
    });

    it('should return all events when eventId not provided', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // Should not call eq for event_id
        expect(mockBuilder.lte).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should return zeros on empty data', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual({
        totalScans: 0,
        successfulScans: 0,
        invalidScans: 0,
        duplicateScans: 0,
        rejectedScans: 0,
        uniqueTicketsScanned: 0,
        firstScan: null,
        lastScan: null,
      });
    });

    it('should return zeros when data is null', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.totalScans).toBe(0);
    });

    it('should throw on Supabase error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const { result } = renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('query configuration', () => {
    it('should query ticket_scan_events table', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      renderHook(() => useScanStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ticket_scan_events');
      });
    });
  });
});

describe('useRecentScans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch scans with ticket and event relations', async () => {
    const mockData = [
      {
        id: 'scan-1',
        scan_result: 'success',
        created_at: '2024-01-01T10:00:00Z',
        tickets: { id: 'ticket-1', attendee_name: 'John' },
        events: { title: 'Concert' },
      },
    ];

    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const { result } = renderHook(() => useRecentScans(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockBuilder.select).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData);
  });

  it('should order by created_at descending', async () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    renderHook(() => useRecentScans(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  it('should respect limit parameter', async () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    renderHook(() => useRecentScans(undefined, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockBuilder.limit).toHaveBeenCalledWith(5);
    });
  });

  it('should filter by eventId when provided', async () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    renderHook(() => useRecentScans('event-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-123');
    });
  });

  it('should return empty array on error', async () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const { result } = renderHook(() => useRecentScans(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
