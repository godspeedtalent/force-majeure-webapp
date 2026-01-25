import { MAX_METRIC_SCORE, METRIC_ORDER } from '../config/reviewMetrics';
import type {
  QualitativeScore,
  ReviewMetricId,
  ReviewMetricScores,
} from '../types';

export const DEFAULT_METRIC_VALUE: QualitativeScore = 2;
export const MAX_TOTAL_REVIEW_SCORE =
  Number(MAX_METRIC_SCORE) * METRIC_ORDER.length;

const clampToScale = (value: number): QualitativeScore => {
  if (Number.isNaN(value)) {
    return DEFAULT_METRIC_VALUE;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= MAX_METRIC_SCORE) {
    return MAX_METRIC_SCORE;
  }
  return value as QualitativeScore;
};

/**
 * Normalize raw values into the 0-4 qualitative score range.
 */
export function normalizeMetricValue(
  raw: number | null | undefined,
  options: { legacyScale?: boolean } = {}
): QualitativeScore {
  if (raw === null || raw === undefined) {
    return DEFAULT_METRIC_VALUE;
  }

  const { legacyScale = false } = options;
  const adjusted = legacyScale ? raw - 1 : raw;
  return clampToScale(adjusted);
}

export function createDefaultMetricScores(): ReviewMetricScores {
  return METRIC_ORDER.reduce<ReviewMetricScores>((acc, id) => {
    acc[id] = DEFAULT_METRIC_VALUE;
    return acc;
  }, {} as ReviewMetricScores);
}

const shouldApplyLegacyScale = (
  initial?: Partial<Record<ReviewMetricId, number | null>>,
  override?: boolean
): boolean => {
  if (typeof override === 'boolean') {
    return override;
  }
  if (!initial) return false;
  return METRIC_ORDER.some(id => {
    const value = initial[id];
    return typeof value === 'number' && value > MAX_METRIC_SCORE;
  });
};

export function withNormalizedMetricScores(
  initial?: Partial<Record<ReviewMetricId, number | null>>,
  options: { legacyScale?: boolean } = {}
): ReviewMetricScores {
  const useLegacyScale = shouldApplyLegacyScale(initial, options.legacyScale);

  if (!initial) {
    return createDefaultMetricScores();
  }

  return METRIC_ORDER.reduce<ReviewMetricScores>((acc, id) => {
    acc[id] = normalizeMetricValue(initial[id] ?? undefined, {
      legacyScale: useLegacyScale,
    });
    return acc;
  }, {} as ReviewMetricScores);
}

export function calculateTotalScore(scores: ReviewMetricScores): number {
  return METRIC_ORDER.reduce((total, id) => total + scores[id], 0);
}
