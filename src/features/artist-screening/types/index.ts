/**
 * Artist Screening Types
 *
 * Type definitions for the artist screening system where FM staff review
 * and approve artist DJ set submissions for venue bookings and event undercard slots.
 */

import type { SubmissionTagWithDetails } from '@/features/tagging/types';

// ============================================================================
// Core Enums
// ============================================================================

export type SubmissionContext = 'general' | 'event' | 'venue';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

// ============================================================================
// Database Tables
// ============================================================================

/**
 * Screening submission from database
 */
export interface ScreeningSubmission {
  id: string;
  artist_id: string;
  recording_id: string;
  context_type: SubmissionContext;
  event_id: string | null;
  venue_id: string | null;
  status: SubmissionStatus;
  has_genre_mismatch: boolean;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Submission with full details (joined data)
 */
export interface ScreeningSubmissionWithDetails extends ScreeningSubmission {
  artists: {
    id: string;
    name: string;
    image_url: string | null;
    // Artist genres for badge display
    artist_genres?: Array<{
      id: string;
      genre_id: string;
      is_primary: boolean;
      genre: {
        id: string;
        name: string;
      };
    }>;
  };
  artist_recordings: {
    id: string;
    name: string;
    url: string;
    platform: 'spotify' | 'soundcloud' | 'youtube';
    duration_seconds: number | null;
  };
  venues?: {
    id: string;
    name: string;
    // Venue required genres for conditional gold styling
    venue_required_genres?: Array<{
      genre_id: string;
    }>;
  } | null;
  events?: {
    id: string;
    title: string;
    start_time: string;
  } | null;
  screening_reviews: ScreeningReview[];
  submission_scores?: SubmissionScore | null;
  // Submission tags (with full tag details)
  submission_tags?: SubmissionTagWithDetails[];
}

/**
 * Staff review of a submission
 */
export interface ScreeningReview {
  id: string;
  submission_id: string;
  reviewer_id: string;
  rating: number; // 1-10
  internal_notes: string | null;
  listen_duration_seconds: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Calculated scoring metrics for a submission
 */
export interface SubmissionScore {
  submission_id: string;
  review_count: number;
  raw_avg_score: number | null;
  confidence_multiplier: number | null;
  confidence_adjusted_score: number | null;
  time_decay_multiplier: number | null;
  hot_score: number | null;
  indexed_score: number | null; // 0-100
  hot_indexed_score: number | null; // 0-100 with time decay
  calculated_at: string;
}

/**
 * System configuration
 */
export interface ScreeningConfig {
  id: number;
  min_reviews_for_approval: number;
  min_listen_time_seconds: number;
  min_approval_score: number;
  confidence_tier_2_reviews: number;
  confidence_tier_3_reviews: number;
  confidence_tier_4_reviews: number;
  confidence_tier_5_plus_reviews: number;
  hot_score_half_life_days: number;
  hot_score_min_multiplier: number;
  updated_at: string;
}

/**
 * Venue genre requirement
 */
export interface VenueRequiredGenre {
  id: string;
  venue_id: string;
  genre_id: string;
  created_at: string;
}

// ============================================================================
// Input Types (for mutations)
// ============================================================================

/**
 * Input for creating a new submission
 */
export interface CreateSubmissionInput {
  artist_id: string;
  recording_id: string;
  context_type: SubmissionContext;
  event_id?: string;
  venue_id?: string;
}

/**
 * Input for creating a review
 */
export interface CreateReviewInput {
  submission_id: string;
  rating: number; // 1-10
  internal_notes?: string;
  listen_duration_seconds: number;
}

/**
 * Input for making a final decision
 */
export interface MakeDecisionInput {
  submission_id: string;
  decision: 'approved' | 'rejected';
  decision_note?: string;
}

/**
 * Input for updating config
 */
export interface UpdateConfigInput {
  min_reviews_for_approval?: number;
  min_listen_time_seconds?: number;
  min_approval_score?: number;
  hot_score_half_life_days?: number;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

/**
 * Filters for submission queries
 */
export interface SubmissionFilters {
  context?: SubmissionContext | 'all';
  status?: SubmissionStatus | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  genreMismatch?: boolean; // Filter to only mismatched genres
  minReviews?: number; // Minimum number of reviews
  excludeIgnored?: boolean; // Exclude user-ignored submissions (default: true)
  sortBy?: 'created_at' | 'indexed_score' | 'hot_indexed_score' | 'review_count';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Aggregate stats for dashboard cards
 */
export interface SubmissionStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  avgReviewTime: number; // Hours from submission to first review
  approvalRate: number; // Percentage
}

// ============================================================================
// Timer Types
// ============================================================================

/**
 * Review timer state (persisted in localStorage)
 */
export interface ReviewTimerState {
  submissionId: string;
  startTime: number; // Unix timestamp
  duration: number; // Total duration in seconds (1200 = 20 minutes)
  isActive: boolean;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Submission ranking item (for leaderboards)
 */
export interface SubmissionRanking {
  submission_id: string;
  artist_id: string;
  artist_name: string;
  artist_image_url: string | null;
  recording_name: string;
  recording_url: string;
  platform: 'spotify' | 'soundcloud' | 'youtube';
  indexed_score: number; // 0-100
  review_count: number;
  approved_at: string | null;
}

/**
 * HOT ranking item with time decay
 */
export interface HotRankingItem extends SubmissionRanking {
  hot_indexed_score: number; // 0-100 with time decay
  days_since_approval: number;
}

/**
 * Reviewer statistics
 */
export interface ReviewerStats {
  reviewer_id: string;
  display_name: string | null;
  avatar_url: string | null;
  review_count: number;
  avg_rating_given: number;
  total_listen_time_seconds: number;
}

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * Props for submission card/row display
 */
export interface SubmissionDisplayProps {
  submission: ScreeningSubmissionWithDetails;
  onReviewClick?: (submissionId: string) => void;
  showActions?: boolean;
}

/**
 * Props for review timer modal
 */
export interface ReviewTimerProps {
  submissionId: string;
  remainingSeconds: number;
  onCancel: () => void;
  onReturnToSubmission: () => void;
}

/**
 * Props for review form
 */
export interface ReviewFormProps {
  submissionId: string;
  onSubmit: (data: CreateReviewInput) => void;
  isLoading?: boolean;
}
