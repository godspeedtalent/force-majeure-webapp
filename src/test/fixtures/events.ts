import { Event } from '@/features/events/types';

/**
 * Mock event data for testing
 */
export function createMockEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'A test event description',
    start_time: '2025-12-01T20:00:00Z',
    end_time: '2025-12-02T02:00:00Z',
    venue_id: 'test-venue-id',
    headliner_id: 'test-artist-id',
    venue: {
      id: 'test-venue-id',
      name: 'Test Venue',
      address_line_1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      capacity: 500,
    },
    image_url: 'https://example.com/event.jpg',
    status: 'published',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    organization_id: 'test-org-id',
    ...overrides,
  };
}

/**
 * Create multiple mock events
 */
export function createMockEvents(count: number): Event[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      id: `test-event-${i}`,
      title: `Test Event ${i + 1}`,
    })
  );
}
