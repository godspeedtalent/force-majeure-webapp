import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mockRpc is available when vi.mock is hoisted
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/shared', () => ({
  supabase: {
    rpc: mockRpc,
  },
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { incrementEventView, recordEventView, getEventViewCount } from './eventViewsService';

describe('eventViewsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // incrementEventView Tests
  // ============================================================================

  describe('incrementEventView', () => {
    it('should increment view count and return new count', async () => {
      mockRpc.mockResolvedValue({ data: 42, error: null });

      const result = await incrementEventView('event-123');

      expect(result).toEqual({ success: true, newCount: 42 });
      expect(mockRpc).toHaveBeenCalledWith('increment_event_view', {
        p_event_id: 'event-123',
      });
    });

    it('should return 0 when data is null', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await incrementEventView('event-123');

      expect(result).toEqual({ success: true, newCount: 0 });
    });

    it('should return error when RPC fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await incrementEventView('event-123');

      expect(result).toEqual({
        success: false,
        error: 'Database connection failed',
      });
    });

    it('should handle exception and return error', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await incrementEventView('event-123');

      expect(result).toEqual({
        success: false,
        error: 'Error: Network error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockRpc.mockRejectedValue('String error');

      const result = await incrementEventView('event-123');

      expect(result).toEqual({
        success: false,
        error: 'String error',
      });
    });
  });

  // ============================================================================
  // recordEventView Tests (deprecated wrapper)
  // ============================================================================

  describe('recordEventView (deprecated)', () => {
    it('should call incrementEventView internally', async () => {
      mockRpc.mockResolvedValue({ data: 10, error: null });

      const result = await recordEventView({ eventId: 'event-123' });

      expect(result).toEqual({ success: true });
      expect(mockRpc).toHaveBeenCalledWith('increment_event_view', {
        p_event_id: 'event-123',
      });
    });
  });

  // ============================================================================
  // getEventViewCount Tests
  // ============================================================================

  describe('getEventViewCount', () => {
    it('should return view count for event', async () => {
      mockRpc.mockResolvedValue({ data: 42, error: null });

      const result = await getEventViewCount('event-123');

      expect(result).toEqual({ count: 42 });
      expect(mockRpc).toHaveBeenCalledWith('get_event_view_count', {
        p_event_id: 'event-123',
      });
    });

    it('should return 0 when data is null', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await getEventViewCount('event-123');

      expect(result).toEqual({ count: 0 });
    });

    it('should return 0 when data is undefined', async () => {
      mockRpc.mockResolvedValue({ data: undefined, error: null });

      const result = await getEventViewCount('event-123');

      expect(result).toEqual({ count: 0 });
    });

    it('should handle string data by converting to number', async () => {
      mockRpc.mockResolvedValue({ data: '100', error: null });

      const result = await getEventViewCount('event-123');

      expect(result).toEqual({ count: 100 });
    });

    it('should return error when RPC fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      const result = await getEventViewCount('event-123');

      expect(result).toEqual({ count: 0, error: 'Query failed' });
    });

    it('should handle exception and return error with count 0', async () => {
      mockRpc.mockRejectedValue(new Error('Connection timeout'));

      const result = await getEventViewCount('event-123');

      expect(result).toEqual({
        count: 0,
        error: 'Error: Connection timeout',
      });
    });

    it('should handle non-numeric data gracefully', async () => {
      mockRpc.mockResolvedValue({ data: 'not a number', error: null });

      const result = await getEventViewCount('event-123');

      // Number('not a number') returns NaN, || 0 catches it
      expect(result).toEqual({ count: 0 });
    });
  });
});
