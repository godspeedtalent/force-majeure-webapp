/**
 * FmRecordingRatingsBreakdown
 *
 * Displays a detailed breakdown of all ratings for a recording.
 * Includes average score, distribution chart, and individual ratings list.
 * Only visible to developers and admins.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, User, BarChart3, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/shared';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  useRecordingRatings,
  useRecordingRatingStats,
} from '@/shared/api/queries/recordingRatingQueries';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';

interface FmRecordingRatingsBreakdownProps {
  /** Recording ID */
  recordingId: string;
  /** Additional CSS classes */
  className?: string;
}

export function FmRecordingRatingsBreakdown({
  recordingId,
  className,
}: FmRecordingRatingsBreakdownProps) {
  const { t } = useTranslation('pages');
  const { hasAnyRole } = useUserPermissions();

  // Check if user can view ratings
  const canView = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  // Fetch ratings and stats
  const { data: ratings, isLoading: ratingsLoading } =
    useRecordingRatings(recordingId);
  const { data: stats, isLoading: statsLoading } =
    useRecordingRatingStats(recordingId);

  // Calculate distribution for chart
  const distributionData = useMemo(() => {
    if (!ratings) return [];

    const counts: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      counts[i] = 0;
    }

    ratings.forEach(rating => {
      counts[rating.score]++;
    });

    return Object.entries(counts).map(([score, count]) => ({
      score: parseInt(score),
      count,
    }));
  }, [ratings]);

  // Don't render if user can't view
  if (!canView) {
    return null;
  }

  const isLoading = ratingsLoading || statsLoading;

  if (isLoading) {
    return (
      <FmCommonCard className={cn('flex items-center justify-center py-8', className)}>
        <FmCommonLoadingSpinner size="md" />
      </FmCommonCard>
    );
  }

  // No ratings yet
  if (!ratings || ratings.length === 0) {
    return (
      <FmCommonCard className={cn('text-center py-8', className)}>
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {t('recordingRatings.noRatings', 'No ratings yet')}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {t(
            'recordingRatings.beFirstToRate',
            'Be the first to rate this recording'
          )}
        </p>
      </FmCommonCard>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average Score */}
        <FmCommonCard size="sm" className="text-center">
          <Star className="h-5 w-5 mx-auto text-fm-gold mb-2" />
          <p className="text-3xl font-bold text-fm-gold">
            {stats?.average_score.toFixed(1) || '-'}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {t('recordingRatings.avgScore', 'Avg Score')}
          </p>
        </FmCommonCard>

        {/* Total Ratings */}
        <FmCommonCard size="sm" className="text-center">
          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-3xl font-bold">{stats?.rating_count || 0}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {t('recordingRatings.totalRatings', 'Ratings')}
          </p>
        </FmCommonCard>

        {/* Min Score */}
        <FmCommonCard size="sm" className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {t('recordingRatings.min', 'Min')}
          </p>
          <p className="text-2xl font-bold">{stats?.min_score || '-'}</p>
        </FmCommonCard>

        {/* Max Score */}
        <FmCommonCard size="sm" className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {t('recordingRatings.max', 'Max')}
          </p>
          <p className="text-2xl font-bold">{stats?.max_score || '-'}</p>
        </FmCommonCard>
      </div>

      {/* Distribution Chart */}
      <FmCommonCard>
        <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
          {t('recordingRatings.distribution', 'Score Distribution')}
        </h4>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData}>
              <XAxis
                dataKey="score"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                width={30}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {distributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count > 0 ? '#dfba7d' : '#374151'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FmCommonCard>

      {/* Individual Ratings List */}
      <FmCommonCard>
        <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
          {t('recordingRatings.allRatings', 'All Ratings')} ({ratings.length})
        </h4>
        <div className="space-y-3">
          {ratings.map(rating => (
            <div
              key={rating.id}
              className={cn(
                'flex items-start gap-3 p-3',
                'bg-black/40 border border-white/10',
                'rounded-none'
              )}
            >
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {rating.profiles?.avatar_url ? (
                  <img
                    src={rating.profiles.avatar_url}
                    alt={rating.profiles.display_name || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Rating Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">
                    {rating.profiles?.display_name || 'Unknown User'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5',
                            i <= Math.round(rating.score / 2)
                              ? 'fill-fm-gold text-fm-gold'
                              : 'text-white/20'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-fm-gold ml-1">
                      {rating.score}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {rating.notes && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    "{rating.notes}"
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {new Date(rating.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </FmCommonCard>
    </div>
  );
}
