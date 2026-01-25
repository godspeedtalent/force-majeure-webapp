import { describe, expect, it } from 'vitest';

import {
  MAX_TOTAL_REVIEW_SCORE,
  calculateTotalScore,
  createDefaultMetricScores,
  normalizeMetricValue,
  withNormalizedMetricScores,
} from './reviewScoring';

describe('reviewScoring helpers', () => {
  it('creates neutral defaults for every metric', () => {
    const scores = createDefaultMetricScores();
    expect(Object.values(scores)).toEqual([2, 2, 2]);
  });

  it('normalizes legacy 1-5 values into 0-4 range when flagged', () => {
    expect(normalizeMetricValue(1, { legacyScale: true })).toBe(0);
    expect(normalizeMetricValue(2, { legacyScale: true })).toBe(1);
    expect(normalizeMetricValue(3, { legacyScale: true })).toBe(2);
    expect(normalizeMetricValue(4, { legacyScale: true })).toBe(3);
    expect(normalizeMetricValue(5, { legacyScale: true })).toBe(4);
  });

  it('clamps out-of-range values and falls back to neutral for missing entries', () => {
    expect(normalizeMetricValue(-4)).toBe(0);
    expect(normalizeMetricValue(42)).toBe(4);
    expect(normalizeMetricValue(undefined)).toBe(2);
    expect(normalizeMetricValue(null)).toBe(2);
  });

  it('normalizes partial score objects while preserving defaults', () => {
    const scores = withNormalizedMetricScores(
      {
        trackSelection: 5,
        flowEnergy: 1,
      },
      { legacyScale: true }
    );
    expect(scores).toMatchObject({
      trackSelection: 4, // 5 -> 4 after subtracting 1 (legacy 1-5 scale)
      flowEnergy: 0, // 1 -> 0
    });
    expect(scores.technicalExecution).toBe(2);
  });

  it('calculates total scores within max range', () => {
    const scores = withNormalizedMetricScores(
      {
        trackSelection: 5,
        flowEnergy: 5,
        technicalExecution: 5,
      },
      { legacyScale: true }
    );
    const total = calculateTotalScore(scores);
    expect(total).toBe(MAX_TOTAL_REVIEW_SCORE);
  });
});
