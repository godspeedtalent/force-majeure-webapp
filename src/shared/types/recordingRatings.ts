/**
 * Recording Rating Types
 * Types for the internal DJ recording rating system (developers/admins only)
 */

/**
 * Base recording rating record from database
 */
export interface RecordingRating {
  id: string;
  recording_id: string;
  user_id: string;
  score: number; // 1-10
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Recording rating with joined user profile data
 */
export interface RecordingRatingWithUser extends RecordingRating {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Recording with all its ratings and related data
 */
export interface RecordingWithRatings {
  id: string;
  artist_id: string;
  name: string;
  url: string;
  cover_art: string | null;
  platform: 'spotify' | 'soundcloud';
  recording_type: 'track' | 'dj_set';
  is_primary_dj_set: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  artists: {
    id: string;
    name: string;
    image_url: string | null;
  };
  recording_ratings: RecordingRatingWithUser[];
}

/**
 * Aggregated rating statistics for a recording
 */
export interface RecordingRatingStats {
  recording_id: string;
  average_score: number;
  rating_count: number;
  min_score: number;
  max_score: number;
}

/**
 * Filter options for the analytics dashboard
 */
export interface RecordingAnalyticsFilters {
  minScore?: number;
  maxScore?: number;
  genres?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minRatingCount?: number;
  platform?: 'spotify' | 'soundcloud' | 'all';
  recordingType?: 'track' | 'dj_set' | 'all';
  sortBy?: 'average_score' | 'rating_count' | 'created_at' | 'name';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Input for creating a new rating
 */
export interface CreateRatingInput {
  recording_id: string;
  score: number;
  notes?: string;
}

/**
 * Input for updating an existing rating
 */
export interface UpdateRatingInput {
  score?: number;
  notes?: string;
}

/**
 * Summary stats for the analytics dashboard header
 */
export interface RatingDashboardStats {
  totalRatedRecordings: number;
  totalRatings: number;
  averageOverallScore: number;
  topRatedRecording: {
    id: string;
    name: string;
    artist_name: string;
    average_score: number;
  } | null;
  mostActiveReviewer: {
    user_id: string;
    display_name: string;
    rating_count: number;
  } | null;
}
