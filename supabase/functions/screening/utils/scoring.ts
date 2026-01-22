/**
 * Scoring utilities for artist screening
 */

interface Review {
  technical_score: number;
  artistic_score: number;
  genre_fit_score: number;
}

interface ScoringWeights {
  technical_weight: number;
  artistic_weight: number;
  genre_fit_weight: number;
}

/**
 * Calculate overall score from reviews using weighted average
 */
export function calculateOverallScore(
  reviews: Review[],
  weights: ScoringWeights
): number {
  if (!reviews || reviews.length === 0) {
    return 0;
  }

  // Calculate average for each category
  const avgTechnical =
    reviews.reduce((sum, r) => sum + r.technical_score, 0) / reviews.length;
  const avgArtistic =
    reviews.reduce((sum, r) => sum + r.artistic_score, 0) / reviews.length;
  const avgGenreFit =
    reviews.reduce((sum, r) => sum + r.genre_fit_score, 0) / reviews.length;

  // Calculate weighted overall score
  const overallScore =
    avgTechnical * weights.technical_weight +
    avgArtistic * weights.artistic_weight +
    avgGenreFit * weights.genre_fit_weight;

  // Round to 2 decimal places
  return Math.round(overallScore * 100) / 100;
}

/**
 * Check if submission meets approval threshold
 */
export function meetsApprovalThreshold(
  overallScore: number,
  threshold: number
): boolean {
  return overallScore >= threshold;
}

/**
 * Check if submission has minimum required reviews
 */
export function hasMinimumReviews(
  reviewCount: number,
  minRequired: number
): boolean {
  return reviewCount >= minRequired;
}
