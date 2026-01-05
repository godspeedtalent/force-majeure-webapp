/**
 * Fuzzy Search Utilities
 *
 * Provides client-side fuzzy matching using Fuse.js for re-ranking
 * database results and handling edge cases.
 */

import Fuse, { type IFuseOptions } from 'fuse.js';

// ============================================================================
// Types
// ============================================================================

export interface FuzzySearchOptions<T> {
  /** Keys to search within objects */
  keys: Array<keyof T | string>;
  /** Minimum score to include in results (0-1, where 0 is perfect match) */
  threshold?: number;
  /** Maximum number of results to return */
  limit?: number;
}

export interface FuzzySearchResult<T> {
  item: T;
  /** Score from 0 (perfect match) to 1 (no match) - lower is better */
  fuseScore: number;
  /** Database similarity score if available (0-1, higher is better) */
  dbSimilarity?: number;
  /** Combined ranking score (0-1, higher is better) */
  combinedScore: number;
}

export interface SearchableItem {
  id: string;
  similarity_score?: number;
  [key: string]: unknown;
}

// ============================================================================
// Default Fuse.js Configuration
// ============================================================================

const DEFAULT_FUSE_OPTIONS: Partial<IFuseOptions<unknown>> = {
  // Tune for artist/event names which are typically short
  threshold: 0.4,
  // Allow matching anywhere in the string
  distance: 100,
  // More lenient matching for short queries
  minMatchCharLength: 2,
  // Include score for re-ranking
  includeScore: true,
  // Don't ignore location of match
  ignoreLocation: false,
  // Find matches even with significant typos
  findAllMatches: true,
};

// ============================================================================
// Core Fuzzy Search Functions
// ============================================================================

/**
 * Create a Fuse.js instance for fuzzy searching
 *
 * @param items - Array of items to search
 * @param options - Fuzzy search options
 * @returns Fuse instance
 */
export function createFuseInstance<T>(
  items: T[],
  options: FuzzySearchOptions<T>
): Fuse<T> {
  const fuseOptions: IFuseOptions<T> = {
    ...DEFAULT_FUSE_OPTIONS,
    keys: options.keys as string[],
    threshold: options.threshold ?? DEFAULT_FUSE_OPTIONS.threshold,
  };

  return new Fuse(items, fuseOptions);
}

/**
 * Perform fuzzy search on an array of items
 *
 * @param items - Array of items to search
 * @param query - Search query
 * @param options - Fuzzy search options
 * @returns Array of matching items with scores
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions<T>
): FuzzySearchResult<T>[] {
  if (!query || query.trim().length < 2) {
    return items.map(item => ({
      item,
      fuseScore: 0,
      combinedScore: 1,
    }));
  }

  const fuse = createFuseInstance(items, options);
  const results = fuse.search(query);

  return results
    .map(result => ({
      item: result.item,
      fuseScore: result.score ?? 0,
      combinedScore: 1 - (result.score ?? 0), // Convert to higher-is-better
    }))
    .slice(0, options.limit ?? 50);
}

/**
 * Re-rank database results using Fuse.js for improved relevance
 *
 * Combines PostgreSQL similarity scores with Fuse.js scores for
 * better ranking. Uses weighted formula:
 *   combinedScore = (dbSimilarity * DB_WEIGHT) + ((1 - fuseScore) * FUSE_WEIGHT)
 *
 * @param items - Items from database with similarity_score
 * @param query - Original search query
 * @param options - Fuzzy search options
 * @returns Re-ranked results with combined scores
 */
export function reRankWithFuse<T extends SearchableItem>(
  items: T[],
  query: string,
  options: FuzzySearchOptions<T>
): FuzzySearchResult<T>[] {
  if (!items.length || !query) {
    return items.map(item => ({
      item,
      fuseScore: 0,
      dbSimilarity: item.similarity_score,
      combinedScore: item.similarity_score ?? 0,
    }));
  }

  // Weights for combining scores
  const DB_WEIGHT = 0.6;
  const FUSE_WEIGHT = 0.4;

  const fuse = createFuseInstance(items, options);
  const fuseResults = fuse.search(query);

  // Create a map for quick lookup of Fuse scores
  const fuseScoreMap = new Map<string, number>();
  fuseResults.forEach(result => {
    const item = result.item as T;
    fuseScoreMap.set(item.id, result.score ?? 0);
  });

  // Combine scores and re-rank
  const rankedResults = items.map(item => {
    const fuseScore = fuseScoreMap.get(item.id) ?? 1; // 1 = no match
    const dbSimilarity = item.similarity_score ?? 0;

    // Convert fuseScore (lower is better) to match dbSimilarity (higher is better)
    const normalizedFuseScore = 1 - fuseScore;

    const combinedScore =
      dbSimilarity * DB_WEIGHT + normalizedFuseScore * FUSE_WEIGHT;

    return {
      item,
      fuseScore,
      dbSimilarity,
      combinedScore,
    };
  });

  // Sort by combined score (descending)
  return rankedResults
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, options.limit ?? 50);
}

/**
 * Calculate similarity between two strings using Fuse.js
 *
 * Useful for single-item comparisons without creating a full Fuse instance.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1, where 1 is identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1.toLowerCase() === str2.toLowerCase()) return 1;

  const fuse = new Fuse([{ text: str1 }], {
    keys: ['text'],
    includeScore: true,
    threshold: 1, // Accept all matches
  });

  const results = fuse.search(str2);
  if (results.length === 0) return 0;

  return 1 - (results[0].score ?? 1);
}

// ============================================================================
// Pre-configured Search Functions for Common Entity Types
// ============================================================================

/**
 * Fuzzy search configuration for artists
 */
export const ARTIST_SEARCH_CONFIG: FuzzySearchOptions<{ name: string }> = {
  keys: ['name'],
  threshold: 0.4,
  limit: 10,
};

/**
 * Fuzzy search configuration for events
 */
export const EVENT_SEARCH_CONFIG: FuzzySearchOptions<{
  title: string;
  description?: string;
}> = {
  keys: ['title', 'description'],
  threshold: 0.4,
  limit: 10,
};

/**
 * Fuzzy search configuration for venues
 */
export const VENUE_SEARCH_CONFIG: FuzzySearchOptions<{ name: string }> = {
  keys: ['name'],
  threshold: 0.4,
  limit: 10,
};

/**
 * Fuzzy search configuration for profiles
 */
export const PROFILE_SEARCH_CONFIG: FuzzySearchOptions<{
  display_name?: string;
  full_name?: string;
}> = {
  keys: ['display_name', 'full_name'],
  threshold: 0.4,
  limit: 10,
};

/**
 * Fuzzy search configuration for organizations
 */
export const ORGANIZATION_SEARCH_CONFIG: FuzzySearchOptions<{ name: string }> =
  {
    keys: ['name'],
    threshold: 0.4,
    limit: 10,
  };
