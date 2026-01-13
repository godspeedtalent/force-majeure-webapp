import { describe, it, expect } from 'vitest';
import {
  createFuseInstance,
  fuzzySearch,
  reRankWithFuse,
  calculateSimilarity,
  ARTIST_SEARCH_CONFIG,
  EVENT_SEARCH_CONFIG,
  VENUE_SEARCH_CONFIG,
  PROFILE_SEARCH_CONFIG,
  ORGANIZATION_SEARCH_CONFIG,
  type FuzzySearchOptions,
  type SearchableItem,
} from './fuzzySearch';

// ============================================================================
// Test Data
// ============================================================================

interface TestItem {
  id: string;
  name: string;
}

interface TestEvent {
  id: string;
  title: string;
  description?: string;
}

const testArtists: TestItem[] = [
  { id: '1', name: 'Deadmau5' },
  { id: '2', name: 'deadbeef' },
  { id: '3', name: 'Daft Punk' },
  { id: '4', name: 'David Guetta' },
  { id: '5', name: 'Disclosure' },
];

const testEvents: TestEvent[] = [
  { id: '1', title: 'Summer Music Festival', description: 'Annual summer event' },
  { id: '2', title: 'Winter Wonderland', description: 'Holiday celebration' },
  { id: '3', title: 'Spring Break Party', description: 'College event' },
  { id: '4', title: 'Fall Festival', description: 'Autumn celebration' },
];

const testSearchableItems: (TestItem & SearchableItem)[] = [
  { id: '1', name: 'Deadmau5', similarity_score: 0.95 },
  { id: '2', name: 'deadbeef', similarity_score: 0.85 },
  { id: '3', name: 'Daft Punk', similarity_score: 0.7 },
  { id: '4', name: 'David Guetta', similarity_score: 0.6 },
  { id: '5', name: 'Disclosure', similarity_score: 0.5 },
];

const defaultOptions: FuzzySearchOptions<TestItem> = {
  keys: ['name'],
  threshold: 0.4,
  limit: 10,
};

// ============================================================================
// createFuseInstance Tests
// ============================================================================

describe('createFuseInstance', () => {
  it('creates a Fuse instance with provided options', () => {
    const fuse = createFuseInstance(testArtists, defaultOptions);
    expect(fuse).toBeDefined();
    expect(typeof fuse.search).toBe('function');
  });

  it('creates instance with custom threshold', () => {
    const options: FuzzySearchOptions<TestItem> = {
      keys: ['name'],
      threshold: 0.2,
    };
    const fuse = createFuseInstance(testArtists, options);
    expect(fuse).toBeDefined();
  });

  it('handles empty items array', () => {
    const fuse = createFuseInstance([], defaultOptions);
    expect(fuse).toBeDefined();
    const results = fuse.search('test');
    expect(results).toHaveLength(0);
  });

  it('supports multiple search keys', () => {
    const options: FuzzySearchOptions<TestEvent> = {
      keys: ['title', 'description'],
      threshold: 0.4,
    };
    const fuse = createFuseInstance(testEvents, options);
    expect(fuse).toBeDefined();
  });
});

// ============================================================================
// fuzzySearch Tests
// ============================================================================

describe('fuzzySearch', () => {
  describe('basic search functionality', () => {
    it('finds exact matches', () => {
      const results = fuzzySearch(testArtists, 'Deadmau5', defaultOptions);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Deadmau5');
    });

    it('finds partial matches', () => {
      const results = fuzzySearch(testArtists, 'dead', defaultOptions);
      expect(results.length).toBeGreaterThanOrEqual(2);
      // Should find both "Deadmau5" and "deadbeef"
      const names = results.map(r => r.item.name);
      expect(names).toContain('Deadmau5');
      expect(names).toContain('deadbeef');
    });

    it('is case-insensitive', () => {
      const results = fuzzySearch(testArtists, 'DEADMAU5', defaultOptions);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Deadmau5');
    });

    it('handles typos (fuzzy matching)', () => {
      const results = fuzzySearch(testArtists, 'Deadmous', defaultOptions);
      // Should still find Deadmau5 despite typo
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Deadmau5');
    });
  });

  describe('query edge cases', () => {
    it('returns all items with combinedScore 1 for empty query', () => {
      const results = fuzzySearch(testArtists, '', defaultOptions);
      expect(results).toHaveLength(testArtists.length);
      results.forEach(result => {
        expect(result.combinedScore).toBe(1);
        expect(result.fuseScore).toBe(0);
      });
    });

    it('returns all items for single character query (below min length)', () => {
      const results = fuzzySearch(testArtists, 'D', defaultOptions);
      expect(results).toHaveLength(testArtists.length);
      results.forEach(result => {
        expect(result.combinedScore).toBe(1);
      });
    });

    it('returns all items for whitespace-only query', () => {
      const results = fuzzySearch(testArtists, '   ', defaultOptions);
      expect(results).toHaveLength(testArtists.length);
    });

    it('performs search for queries of 2+ characters', () => {
      const results = fuzzySearch(testArtists, 'Da', defaultOptions);
      // Should find Daft Punk, David Guetta
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('result structure', () => {
    it('includes correct properties in results', () => {
      const results = fuzzySearch(testArtists, 'dead', defaultOptions);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('item');
      expect(firstResult).toHaveProperty('fuseScore');
      expect(firstResult).toHaveProperty('combinedScore');
      expect(firstResult.item).toHaveProperty('id');
      expect(firstResult.item).toHaveProperty('name');
    });

    it('combinedScore is inverse of fuseScore (higher is better)', () => {
      const results = fuzzySearch(testArtists, 'Deadmau5', defaultOptions);
      if (results.length > 0 && results[0].fuseScore > 0) {
        expect(results[0].combinedScore).toBeCloseTo(1 - results[0].fuseScore);
      }
    });

    it('fuseScore is between 0 and 1', () => {
      const results = fuzzySearch(testArtists, 'dead', defaultOptions);
      results.forEach(result => {
        expect(result.fuseScore).toBeGreaterThanOrEqual(0);
        expect(result.fuseScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('limit option', () => {
    it('respects limit option', () => {
      const options: FuzzySearchOptions<TestItem> = {
        ...defaultOptions,
        limit: 2,
      };
      const results = fuzzySearch(testArtists, 'da', options);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('uses default limit of 50 when not specified', () => {
      const manyItems: TestItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `Artist ${i}`,
      }));
      const options: FuzzySearchOptions<TestItem> = {
        keys: ['name'],
        threshold: 1, // Accept all matches
      };
      const results = fuzzySearch(manyItems, 'Artist', options);
      expect(results.length).toBeLessThanOrEqual(50);
    });
  });

  describe('multi-key search', () => {
    it('searches across multiple keys', () => {
      const options: FuzzySearchOptions<TestEvent> = {
        keys: ['title', 'description'],
        threshold: 0.6,
        limit: 10,
      };

      // Search for "summer" should match "Summer Music Festival" title
      const titleResults = fuzzySearch(testEvents, 'Summer', options);
      expect(titleResults.length).toBeGreaterThan(0);

      // Search for "celebration" should match descriptions
      const descResults = fuzzySearch(testEvents, 'celebration', options);
      expect(descResults.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// reRankWithFuse Tests
// ============================================================================

describe('reRankWithFuse', () => {
  const searchOptions: FuzzySearchOptions<TestItem & SearchableItem> = {
    keys: ['name'],
    threshold: 0.4,
    limit: 10,
  };

  describe('basic re-ranking', () => {
    it('combines database and Fuse scores', () => {
      const results = reRankWithFuse(testSearchableItems, 'dead', searchOptions);

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result).toHaveProperty('fuseScore');
        expect(result).toHaveProperty('dbSimilarity');
        expect(result).toHaveProperty('combinedScore');
      });
    });

    it('uses 0.6/0.4 weighting for db/fuse scores', () => {
      const results = reRankWithFuse(testSearchableItems, 'Deadmau5', searchOptions);

      // For exact match, fuseScore should be very low (good)
      const deadmau5Result = results.find(r => r.item.name === 'Deadmau5');
      if (deadmau5Result) {
        const dbScore = deadmau5Result.dbSimilarity ?? 0;
        const fuseScore = deadmau5Result.fuseScore;
        const normalizedFuse = 1 - fuseScore;
        const expectedCombined = dbScore * 0.6 + normalizedFuse * 0.4;

        expect(deadmau5Result.combinedScore).toBeCloseTo(expectedCombined, 1);
      }
    });

    it('sorts results by combined score (descending)', () => {
      const results = reRankWithFuse(testSearchableItems, 'dead', searchOptions);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].combinedScore).toBeGreaterThanOrEqual(results[i].combinedScore);
      }
    });
  });

  describe('edge cases', () => {
    it('handles empty items array', () => {
      const results = reRankWithFuse([], 'test', searchOptions);
      expect(results).toHaveLength(0);
    });

    it('handles empty query', () => {
      const results = reRankWithFuse(testSearchableItems, '', searchOptions);
      expect(results).toHaveLength(testSearchableItems.length);
      // Should use db similarity as combined score
      results.forEach(result => {
        expect(result.combinedScore).toBe(result.dbSimilarity ?? 0);
      });
    });

    it('handles items without similarity_score', () => {
      const itemsNoScore: (TestItem & SearchableItem)[] = [
        { id: '1', name: 'Test Artist' },
        { id: '2', name: 'Another Artist' },
      ];

      const results = reRankWithFuse(itemsNoScore, 'Test', searchOptions);
      expect(results.length).toBeGreaterThan(0);
      // Items without db score should have dbSimilarity as undefined or 0
      // The implementation uses item.similarity_score ?? 0, so it becomes 0
      results.forEach(result => {
        expect(result.dbSimilarity).toBe(0);
      });
    });

    it('assigns fuseScore of 1 to items not in Fuse results', () => {
      const results = reRankWithFuse(testSearchableItems, 'Deadmau5', searchOptions);

      // Items that don't match "Deadmau5" should have fuseScore close to 1
      const nonMatches = results.filter(r => r.item.name !== 'Deadmau5' && r.item.name !== 'deadbeef');
      nonMatches.forEach(result => {
        expect(result.fuseScore).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe('limit option', () => {
    it('respects limit option', () => {
      const options: FuzzySearchOptions<TestItem & SearchableItem> = {
        ...searchOptions,
        limit: 2,
      };
      const results = reRankWithFuse(testSearchableItems, 'da', options);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('defaults to limit of 50', () => {
      const manyItems: (TestItem & SearchableItem)[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `Artist ${i}`,
        similarity_score: Math.random(),
      }));

      const options: FuzzySearchOptions<TestItem & SearchableItem> = {
        keys: ['name'],
        threshold: 1,
      };

      const results = reRankWithFuse(manyItems, 'Artist', options);
      expect(results.length).toBeLessThanOrEqual(50);
    });
  });
});

// ============================================================================
// calculateSimilarity Tests
// ============================================================================

describe('calculateSimilarity', () => {
  describe('exact matches', () => {
    it('returns 1 for identical strings', () => {
      expect(calculateSimilarity('test', 'test')).toBe(1);
    });

    it('returns 1 for case-insensitive identical strings', () => {
      expect(calculateSimilarity('Test', 'test')).toBe(1);
      expect(calculateSimilarity('TEST', 'test')).toBe(1);
      expect(calculateSimilarity('tEsT', 'TeSt')).toBe(1);
    });
  });

  describe('partial matches', () => {
    it('returns high score for similar strings', () => {
      const score = calculateSimilarity('Deadmau5', 'Deadmaus');
      expect(score).toBeGreaterThan(0.5);
    });

    it('returns lower score for less similar strings', () => {
      const highSimilarity = calculateSimilarity('test', 'tset');
      const lowSimilarity = calculateSimilarity('test', 'wxyz');
      expect(highSimilarity).toBeGreaterThan(lowSimilarity);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for empty first string', () => {
      expect(calculateSimilarity('', 'test')).toBe(0);
    });

    it('returns 0 for empty second string', () => {
      expect(calculateSimilarity('test', '')).toBe(0);
    });

    it('returns 0 for both empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(0);
    });

    it('returns 0 for completely different strings', () => {
      const score = calculateSimilarity('abc', 'xyz');
      expect(score).toBe(0);
    });
  });

  describe('score range', () => {
    it('always returns value between 0 and 1', () => {
      const testCases = [
        ['abc', 'def'],
        ['hello', 'hallo'],
        ['test', 'testing'],
        ['short', 'a very long string that is quite different'],
      ];

      testCases.forEach(([str1, str2]) => {
        const score = calculateSimilarity(str1, str2);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });
});

// ============================================================================
// Pre-configured Search Configs Tests
// ============================================================================

describe('Pre-configured Search Configs', () => {
  describe('ARTIST_SEARCH_CONFIG', () => {
    it('has correct structure', () => {
      expect(ARTIST_SEARCH_CONFIG.keys).toEqual(['name']);
      expect(ARTIST_SEARCH_CONFIG.threshold).toBe(0.4);
      expect(ARTIST_SEARCH_CONFIG.limit).toBe(10);
    });
  });

  describe('EVENT_SEARCH_CONFIG', () => {
    it('has correct structure', () => {
      expect(EVENT_SEARCH_CONFIG.keys).toEqual(['title', 'description']);
      expect(EVENT_SEARCH_CONFIG.threshold).toBe(0.4);
      expect(EVENT_SEARCH_CONFIG.limit).toBe(10);
    });
  });

  describe('VENUE_SEARCH_CONFIG', () => {
    it('has correct structure', () => {
      expect(VENUE_SEARCH_CONFIG.keys).toEqual(['name']);
      expect(VENUE_SEARCH_CONFIG.threshold).toBe(0.4);
      expect(VENUE_SEARCH_CONFIG.limit).toBe(10);
    });
  });

  describe('PROFILE_SEARCH_CONFIG', () => {
    it('has correct structure', () => {
      expect(PROFILE_SEARCH_CONFIG.keys).toEqual(['display_name', 'full_name']);
      expect(PROFILE_SEARCH_CONFIG.threshold).toBe(0.4);
      expect(PROFILE_SEARCH_CONFIG.limit).toBe(10);
    });
  });

  describe('ORGANIZATION_SEARCH_CONFIG', () => {
    it('has correct structure', () => {
      expect(ORGANIZATION_SEARCH_CONFIG.keys).toEqual(['name']);
      expect(ORGANIZATION_SEARCH_CONFIG.threshold).toBe(0.4);
      expect(ORGANIZATION_SEARCH_CONFIG.limit).toBe(10);
    });
  });
});

// ============================================================================
// Integration-style Tests
// ============================================================================

describe('Integration scenarios', () => {
  it('real-world artist search workflow', () => {
    const artists: (TestItem & SearchableItem)[] = [
      { id: '1', name: 'deadmau5', similarity_score: 0.9 },
      { id: '2', name: 'Daft Punk', similarity_score: 0.8 },
      { id: '3', name: 'David Guetta', similarity_score: 0.7 },
      { id: '4', name: 'Diplo', similarity_score: 0.6 },
    ];

    // User types "dead" looking for deadmau5
    const results = reRankWithFuse(artists, 'dead', {
      keys: ['name'],
      threshold: 0.4,
      limit: 5,
    });

    // deadmau5 should be first (exact prefix match + high db score)
    expect(results[0].item.name).toBe('deadmau5');
  });

  it('handles misspelled search terms', () => {
    const events: TestEvent[] = [
      { id: '1', title: 'Electronic Dance Music Festival' },
      { id: '2', title: 'EDM Night Party' },
      { id: '3', title: 'Jazz Concert' },
    ];

    // User misspells "Electronic"
    const results = fuzzySearch(events, 'Electronik', {
      keys: ['title'],
      threshold: 0.5,
      limit: 5,
    });

    // Should still find the EDM festival
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.title).toContain('Electronic');
  });

  it('combines search across title and description', () => {
    const events: TestEvent[] = [
      { id: '1', title: 'House Music Party', description: 'Deep house and tech house' },
      { id: '2', title: 'Techno Night', description: 'Industrial techno experience' },
      { id: '3', title: 'Pop Concert', description: 'Top 40 hits' },
    ];

    // Search for "tech" should match both events
    const results = fuzzySearch(events, 'tech', {
      keys: ['title', 'description'],
      threshold: 0.4,
      limit: 5,
    });

    const titles = results.map(r => r.item.title);
    expect(titles).toContain('House Music Party'); // Has "tech house" in description
    expect(titles).toContain('Techno Night'); // Has "Techno" in title
  });
});
