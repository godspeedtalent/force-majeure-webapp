import { ProductionEventDataRepository } from './ProductionEventDataRepository';
import { TestEventDataRepository } from './TestEventDataRepository';
import type { IEventDataRepository } from './types';

/**
 * Singleton repository instances
 * Repositories are stateless, so we can reuse them
 */
const productionRepository = new ProductionEventDataRepository();
const testRepository = new TestEventDataRepository();

/**
 * Get the appropriate event data repository based on event status
 *
 * This is the SINGLE decision point for test vs production data.
 * All downstream code uses the same interface regardless of data source.
 *
 * @param eventStatus - Event status (e.g., 'test', 'published', 'draft')
 * @returns The appropriate repository implementation
 */
export function getEventDataRepository(eventStatus?: string): IEventDataRepository {
  return eventStatus === 'test' ? testRepository : productionRepository;
}

/**
 * Check if an event status indicates a test event
 * Utility function for components that need to know but don't need the repository
 */
export function isTestEventStatus(eventStatus?: string): boolean {
  return eventStatus === 'test';
}
