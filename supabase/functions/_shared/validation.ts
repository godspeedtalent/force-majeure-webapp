/**
 * Shared validation utilities for Edge Functions
 *
 * Provides Zod schemas and validation helpers for common patterns.
 */

import { z } from 'https://deno.land/x/zod/mod.ts';

/**
 * Validate input data against a Zod schema
 * Throws ZodError on validation failure
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Date range parameters
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DateRange = z.infer<typeof DateRangeSchema>;

/**
 * UUID validation
 */
export const UuidSchema = z.string().uuid();

/**
 * Email validation
 */
export const EmailSchema = z.string().email();

/**
 * Enum for common status values
 */
export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'archived']);

// ============================================================================
// Screening-Specific Schemas
// ============================================================================

/**
 * Screening submission filters
 */
export const SubmissionFiltersSchema = z.object({
  context: z.enum(['venue', 'standalone']).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  genreMismatch: z.boolean().optional(),
  minReviews: z.number().int().nonnegative().optional(),
});

export type SubmissionFilters = z.infer<typeof SubmissionFiltersSchema>;

/**
 * Review submission schema
 */
export const CreateReviewSchema = z.object({
  submission_id: UuidSchema,
  rating: z.number().int().min(1).max(10),
  internal_notes: z.string().max(2000).optional(),
  listen_duration_seconds: z.number().int().nonnegative(),
});

export type CreateReview = z.infer<typeof CreateReviewSchema>;

/**
 * Decision submission schema
 */
export const MakeDecisionSchema = z.object({
  submission_id: UuidSchema,
  status: z.enum(['approved', 'rejected']),
  decision_notes: z.string().max(1000).optional(),
});

export type MakeDecision = z.infer<typeof MakeDecisionSchema>;

/**
 * Config update schema
 */
export const UpdateConfigSchema = z.object({
  id: z.number().int().default(1),
  min_reviews_for_approval: z.number().int().nonnegative().optional(),
  min_listen_time_seconds: z.number().int().nonnegative().optional(),
  min_approval_score: z.number().min(0).max(10).optional(),
  hot_score_half_life_days: z.number().int().positive().optional(),
});

export type UpdateConfig = z.infer<typeof UpdateConfigSchema>;

/**
 * Stats query parameters
 */
export const StatsQuerySchema = z.object({
  context: z.enum(['venue', 'standalone']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type StatsQuery = z.infer<typeof StatsQuerySchema>;

/**
 * Rankings query parameters
 */
export const RankingsQuerySchema = z.object({
  context_type: z.enum(['venue', 'standalone']),
  limit: z.number().int().positive().max(100).default(50),
});

export type RankingsQuery = z.infer<typeof RankingsQuerySchema>;
