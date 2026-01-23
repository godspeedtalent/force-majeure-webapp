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
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
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
      <div className="flex items-center justify-center min-h-[200px] md:min-h-[400px]">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[15px] md:gap-[20px]">
      {/* All-Time Rankings */}
      <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
        <div className="flex items-center gap-[10px] mb-[15px] md:mb-[20px]">
          <Trophy className="h-4 w-4 md:h-5 md:w-5 text-fm-gold" />
          <h3 className="text-base md:text-lg font-canela text-white">
            All-Time Rankings
          </h3>
        </div>

        <div className="space-y-[8px] md:space-y-[10px]">
          {allTimeRankings.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-[15px] md:py-[20px]">
              No approved submissions yet.
            </p>
          ) : (
            allTimeRankings.slice(0, 10).map((ranking: SubmissionRanking, index: number) => (
              <div
                key={ranking.submission_id}
                className="flex items-center gap-[8px] md:gap-[10px] p-[8px] md:p-[10px] bg-black/40 hover:bg-black/60 transition-colors rounded-none border border-white/10"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-none text-[10px] md:text-xs font-bold flex-shrink-0',
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
                    className="h-7 w-7 md:h-8 md:w-8 object-cover rounded-none flex-shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 md:h-8 md:w-8 bg-white/10 flex items-center justify-center rounded-none flex-shrink-0">
                    <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/40" />
                  </div>
                )}

                {/* Artist & Recording */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-white truncate">
                    {ranking.artist_name}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                    {ranking.recording_name}
                  </div>
                </div>

                {/* Score */}
                <div className="text-base md:text-lg font-bold text-fm-gold flex-shrink-0">
                  {ranking.indexed_score}
                </div>

                {/* Link */}
                <FmCommonIconButton
                  onClick={() =>
                    window.open(ranking.recording_url, '_blank', 'noopener,noreferrer')
                  }
                  variant="secondary"
                  size="sm"
                  icon={ExternalLink}
                  aria-label="Open recording"
                />
              </div>
            ))
          )}
        </div>
      </FmCommonCard>

      {/* HOT Rankings (Trending) */}
      <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
        <div className="flex items-center gap-[10px] mb-[15px] md:mb-[20px]">
          <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-fm-gold" />
          <h3 className="text-base md:text-lg font-canela text-white">
            HOT Rankings
          </h3>
        </div>

        <div className="space-y-[8px] md:space-y-[10px]">
          {hotRankings.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-[15px] md:py-[20px]">
              No approved submissions yet.
            </p>
          ) : (
            hotRankings.slice(0, 10).map((ranking: HotRankingItem, index: number) => (
              <div
                key={ranking.submission_id}
                className="flex items-center gap-[8px] md:gap-[10px] p-[8px] md:p-[10px] bg-black/40 hover:bg-black/60 transition-colors rounded-none border border-white/10"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-none text-[10px] md:text-xs font-bold flex-shrink-0',
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
                    className="h-7 w-7 md:h-8 md:w-8 object-cover rounded-none flex-shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 md:h-8 md:w-8 bg-white/10 flex items-center justify-center rounded-none flex-shrink-0">
                    <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/40" />
                  </div>
                )}

                {/* Artist & Recording */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-white truncate">
                    {ranking.artist_name}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                    {ranking.recording_name}
                  </div>
                </div>

                {/* HOT Score */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="text-base md:text-lg font-bold text-fm-gold">
                    {ranking.hot_indexed_score}
                  </div>
                  {'days_since_approval' in ranking && ranking.days_since_approval !== undefined && (
                    <div className="text-[10px] md:text-xs text-white/40">
                      {Math.floor(ranking.days_since_approval)}d ago
                    </div>
                  )}
                </div>

                {/* Link */}
                <FmCommonIconButton
                  onClick={() =>
                    window.open(ranking.recording_url, '_blank', 'noopener,noreferrer')
                  }
                  variant="secondary"
                  size="sm"
                  icon={ExternalLink}
                  aria-label="Open recording"
                />
              </div>
            ))
          )}
        </div>
      </FmCommonCard>

      {/* Reviewer Leaderboard */}
      <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
        <div className="flex items-center gap-[10px] mb-[15px] md:mb-[20px]">
          <Users className="h-4 w-4 md:h-5 md:w-5 text-fm-gold" />
          <h3 className="text-base md:text-lg font-canela text-white">
            Reviewer Leaderboard
          </h3>
        </div>

        <div className="space-y-[8px] md:space-y-[10px]">
          {reviewerStats.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-[15px] md:py-[20px]">
              No reviews submitted yet.
            </p>
          ) : (
            reviewerStats.slice(0, 10).map((reviewer: ReviewerStats, index: number) => (
              <div
                key={reviewer.reviewer_id}
                className="flex items-center gap-[8px] md:gap-[10px] p-[8px] md:p-[10px] bg-black/40 hover:bg-black/60 transition-colors rounded-none border border-white/10"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-none text-[10px] md:text-xs font-bold flex-shrink-0',
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
                    className="h-7 w-7 md:h-8 md:w-8 object-cover rounded-none flex-shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 md:h-8 md:w-8 bg-white/10 flex items-center justify-center rounded-none flex-shrink-0">
                    <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/40" />
                  </div>
                )}

                {/* Reviewer Name & Stats */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-white truncate">
                    {reviewer.display_name || 'Unknown'}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">
                    Avg: ⭐ {reviewer.avg_rating_given.toFixed(1)}
                  </div>
                </div>

                {/* Review Count */}
                <div className="text-right flex-shrink-0">
                  <div className="text-base md:text-lg font-bold text-fm-gold">
                    {reviewer.review_count}
                  </div>
                  <div className="text-[10px] md:text-xs text-white/40">
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
