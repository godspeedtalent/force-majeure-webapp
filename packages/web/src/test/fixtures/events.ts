import { Event } from '@/features/events/types';

/**
 * Mock event data for testing
 */
export function createMockEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'A test event description',
    date: '2025-12-01',
    time: '8:00 PM',
    venue_id: 'test-venue-id',
    venue: {
      id: 'test-venue-id',
      name: 'Test Venue',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      capacity: 500,
      created_at: '2025-01-01T00:00:00Z',
    },
    image_url: 'https://example.com/event.jpg',
    status: 'published',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    organization_id: 'test-org-id',
    ticket_sales_start: '2025-01-01T00:00:00Z',
    ticket_sales_end: '2025-12-01T20:00:00Z',
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
