/**
 * Centralized Query Utilities
 *
 * Export all React Query hooks and utilities for type-safe, cached data fetching.
 * All hooks follow consistent patterns:
 * - Query keys factories for cache management
 * - Query hooks with proper typing and enabled flags
 * - Mutation hooks with automatic cache invalidation
 *
 * Usage:
 * ```ts
 * import { useEventById, useVenueById, useArtists } from '@force-majeure/shared';
 * import { eventKeys, venueKeys, artistKeys } from '@force-majeure/shared';
 * ```
 */

// Event queries
export * from './eventQueries';

// Venue queries
export * from './venueQueries';

// Order queries
export * from './orderQueries';

// Ticket tier queries
export * from './ticketTierQueries';

// Artist queries
export * from './artistQueries';
