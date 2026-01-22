/**
 * Analytics Tab
 *
 * Displays analytics for the artist screening system:
 * - All-time rankings (highest rated approved submissions)
 * - HOT rankings (trending with time decay)
 * - Reviewer leaderboard (most active staff reviewers)
 */

import { Trophy, TrendingUp, Users, ExternalLink, User } from 'lucide-react';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { cn } from '@/shared';
import { useSubmissionRankings, useReviewerStats } from '../hooks';
import type { SubmissionRanking, HotRankingItem, ReviewerStats } from '../types';

// ============================================================================
// Component
// ============================================================================

export function AnalyticsTab() {
  // Fetch rankings
  const {
    data: allTimeRankings = [],
    isLoading: isLoadingAllTime,
  } = useSubmissionRankings('all-time');

  const {
    data: hotRankings = [],
    isLoading: isLoadingHot,
  } = useSubmissionRankings('hot');

  const {
    data: reviewerStats = [],
    isLoading: isLoadingReviewers,
  } = useReviewerStats();

  const isLoading = isLoadingAllTime || isLoadingHot || isLoadingReviewers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
      {/* All-Time Rankings */}
      <FmCommonCard variant="frosted" className="p-[20px]">
        <div className="flex items-center gap-[10px] mb-[20px]">
          <Trophy className="h-5 w-5 text-fm-gold" />
          <h3 className="text-lg font-canela text-white">
            All-Time Rankings
          </h3>
        </div>

        <div className="space-y-[10px]">
          {allTimeRankings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-[20px]">
              No approved submissions yet.
            </p>
          ) : (
            allTimeRankings.slice(0, 10).map((ranking: SubmissionRanking, index: number) => (
              <div
                key={ranking.submission_id}
                className="flex items-center gap-[10px] p-[10px] bg-black/40 hover:bg-black/60 transition-colors rounded-none border border-white/10"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-none text-xs font-bold',
                    index === 0
                      ? 'bg-fm-gold text-black'
                      : index === 1
                      ? 'bg-gray-400 text-black'
                      : index === 2
                      ? 'bg-amber-600 text-black'
                      : 'bg-white/10 text-white/60'
                  )}
                >
                  {index + 1}
                </div>

                {/* Artist Image */}
                {ranking.artist_image_url ? (
                  <img
                    src={ranking.artist_image_url}
                    alt={ranking.artist_name}
                    className="h-8 w-8 object-cover rounded-none"
                  />
                ) : (
                  <div className="h-8 w-8 bg-white/10 flex items-center justify-center rounded-none">
                    <User className="h-4 w-4 text-white/40" />
                  </div>
                )}

                {/* Artist & Recording */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {ranking.artist_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {ranking.recording_name}
                  </div>
                </div>

                {/* Score */}
                <div className="text-lg font-bold text-fm-gold">
                  {ranking.indexed_score}
                </div>

                {/* Link */}
                <button
                  onClick={() =>
                    window.open(ranking.recording_url, '_blank', 'noopener,noreferrer')
                  }
                  className="p-1 hover:bg-white/10 transition-colors rounded-none"
                  title="Open recording"
                >
                  <ExternalLink className="h-4 w-4 text-white/60" />
                </button>
              </div>
            ))
          )}
        </div>
      </FmCommonCard>

      {/* HOT Rankings (Trending) */}
      <FmCommonCard variant="frosted" className="p-[20px]">
        <div className="flex items-center gap-[10px] mb-[20px]">
          <TrendingUp className="h-5 w-5 text-fm-gold" />
          <h3 className="text-lg font-canela text-white">
            HOT Rankings
          </h3>
        </div>

        <div className="space-y-[10px]">
          {hotRankings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-[20px]">
              No approved submissions yet.
            </p>
          ) : (
            hotRankings.slice(0, 10).map((ranking: HotRankingItem, index: number) => (
              <div
                key={ranking.submission_id}
                className="flex items-center gap-[10px] p-[10px] bg-black/40 hover:bg-black/60 transition-colors rounded-none border border-white/10"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-none text-xs font-bold',
                    index === 0
                      ? 'bg-fm-gold text-black'
                      : index === 1
                      ? 'bg-gray-400 text-black'
                      : index === 2
                      ? 'bg-amber-600 text-black'
                      : 'bg-white/10 text-white/60'
                  )}
                >
                  {index + 1}
                </div>

                {/* Artist Image */}
                {ranking.artist_image_url ? (
                  <img
                    src={ranking.artist_image_url}
                    alt={ranking.artist_name}
                    className="h-8 w-8 object-cover rounded-none"
                  />
                ) : (
                  <div className="h-8 w-8 bg-white/10 flex items-center justify-center rounded-none">
                    <User className="h-4 w-4 text-white/40" />
                  </div>
                )}

                {/* Artist & Recording */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {ranking.artist_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {ranking.recording_name}
                  </div>
                </div>

                {/* HOT Score */}
                <div className="flex flex-col items-end">
                  <div className="text-lg font-bold text-fm-gold">
                    {ranking.hot_indexed_score}
                  </div>
                  {'days_since_approval' in ranking && ranking.days_since_approval !== undefined && (
                    <div className="text-xs text-white/40">
                      {Math.floor(ranking.days_since_approval)}d ago
                    </div>
                  )}
                </div>

                {/* Link */}
                <button
                  onClick={() =>
                    window.open(ranking.recording_url, '_blank', 'noopener,noreferrer')
                  }
                  className="p-1 hover:bg-white/10 transition-colors rounded-none"
                  title="Open recording"
                >
                  <ExternalLink className="h-4 w-4 text-white/60" />
                </button>
              </div>
            ))
          )}
        </div>
      </FmCommonCard>

      {/* Reviewer Leaderboard */}
      <FmCommonCard variant="frosted" className="p-[20px]">
        <div className="flex items-center gap-[10px] mb-[20px]">
          <Users className="h-5 w-5 text-fm-gold" />
          <h3 className="text-lg font-canela text-white">
            Reviewer Leaderboard
          </h3>
        </div>

        <div className="space-y-[10px]">
          {reviewerStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-[20px]">
              No reviews submitted yet.
            </p>
          ) : (
            reviewerStats.slice(0, 10).map((reviewer: ReviewerStats, index: number) => (
              <div
                key={reviewer.reviewer_id}
                className="flex items-center gap-[10px] p-[10px] bg-black/40 hover:bg-black/60 transition-colors rounded-none border border-white/10"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-none text-xs font-bold',
                    index === 0
                      ? 'bg-fm-gold text-black'
                      : index === 1
                      ? 'bg-gray-400 text-black'
                      : index === 2
                      ? 'bg-amber-600 text-black'
                      : 'bg-white/10 text-white/60'
                  )}
                >
                  {index + 1}
                </div>

                {/* Reviewer Avatar */}
                {reviewer.avatar_url ? (
                  <img
                    src={reviewer.avatar_url}
                    alt={reviewer.display_name || 'Reviewer'}
                    className="h-8 w-8 object-cover rounded-none"
                  />
                ) : (
                  <div className="h-8 w-8 bg-white/10 flex items-center justify-center rounded-none">
                    <User className="h-4 w-4 text-white/40" />
                  </div>
                )}

                {/* Reviewer Name & Stats */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {reviewer.display_name || 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: ⭐ {reviewer.avg_rating_given.toFixed(1)}
                  </div>
                </div>

                {/* Review Count */}
                <div className="text-right">
                  <div className="text-lg font-bold text-fm-gold">
                    {reviewer.review_count}
                  </div>
                  <div className="text-xs text-white/40">
                    reviews
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </FmCommonCard>
    </div>
  );
}
