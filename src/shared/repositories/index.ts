/**
 * Event Data Repository Module
 *
 * Provides a clean abstraction for fetching event-related data.
 * The repository pattern allows test and production data to be accessed
 * through the same interface, with the implementation selected at runtime.
 *
 * Usage:
 * ```typescript
 * import { getEventDataRepository } from '@/shared/repositories';
 *
 * const repo = getEventDataRepository(event.status);
 * const orders = await repo.getOrdersByEventId(eventId);
 * const rsvpCount = await repo.getRsvpCount(eventId);
 * ```
 */

export * from './types';
export { getEventDataRepository, isTestEventStatus } from './eventDataRepositoryFactory';
export { ProductionEventDataRepository } from './ProductionEventDataRepository';
export { TestEventDataRepository } from './TestEventDataRepository';
