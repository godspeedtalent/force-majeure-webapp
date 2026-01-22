/**
 * Screening Queue View
 *
 * Displays submission queue with filtering, sorting, and context menu actions.
 * Uses FmConfigurableDataGrid for the table display.
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Music,
  User,
  Star,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  Trash,
  EyeOff,
  Eye,
} from 'lucide-react';
import {
  FmConfigurableDataGrid,
  type DataGridColumn,
  type DataGridAction,
} from '@/features/data-grid';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { Badge } from '@/components/common/shadcn/badge';
import { cn, formatTimeDisplay } from '@/shared';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { toast } from 'sonner';
import { useScreeningSubmissions } from '../hooks';
import { deleteSubmission, ignoreSubmission, unignoreSubmission } from '../services/submissionService';
import { DeleteSubmissionModal } from './DeleteSubmissionModal';
import type {
  ScreeningSubmissionWithDetails,
  SubmissionContext,
  SubmissionStatus,
  SubmissionFilters,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface ScreeningQueueViewProps {
  /**
   * Context filter (all, general, event, venue)
   */
  context: SubmissionContext | 'all';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status badge color
 */
function getStatusColor(status: SubmissionStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/40';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'pending':
    default:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
  }
}

/**
 * Get platform icon
 */
function getPlatformIcon(
  platform: 'spotify' | 'soundcloud' | 'youtube'
): string {
  switch (platform) {
    case 'spotify':
      return '🎵';
    case 'soundcloud':
      return '☁️';
    case 'youtube':
      return '▶️';
  }
}

// ============================================================================
// Component
// ============================================================================

export function ScreeningQueueView({ context }: ScreeningQueueViewProps) {
  const navigate = useNavigate();
  const { t: tToast } = useTranslation('toasts');
  const { isAdmin, hasRole } = useUserPermissions();
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  const canDelete = isAdmin() || isDeveloper;

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<ScreeningSubmissionWithDetails | null>(null);

  // Show ignored toggle
  const [showIgnored, setShowIgnored] = useState(false);

  // Filters
  const [filters, setFilters] = useState<SubmissionFilters>({
    context: context === 'all' ? undefined : context,
    status: 'pending', // Default to pending submissions
    sortBy: 'created_at',
    sortDirection: 'asc', // FIFO (oldest first)
    excludeIgnored: !showIgnored, // Exclude ignored by default
  });

  // Update exclude ignored when toggle changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, excludeIgnored: !showIgnored }));
  }, [showIgnored]);

  // Fetch submissions
  const { data: submissions = [], isLoading, error, refetch } = useScreeningSubmissions(filters);

  // Column definitions
  const columns = useMemo<DataGridColumn<ScreeningSubmissionWithDetails>[]>(
    () => [
      {
        key: 'artist',
        label: 'Artist',
        sortable: true,
        render: (submission: ScreeningSubmissionWithDetails) => (
          <div className="flex items-center gap-[10px]">
            {submission.artists.image_url ? (
              <img
                src={submission.artists.image_url}
                alt={submission.artists.name}
                className="h-10 w-10 object-cover rounded-none"
              />
            ) : (
              <div className="h-10 w-10 bg-white/10 flex items-center justify-center rounded-none">
                <User className="h-5 w-5 text-white/40" />
              </div>
            )}
            <div>
              <div className="font-medium text-white">
                {submission.artists.name}
              </div>
              {submission.has_genre_mismatch && (
                <div className="flex items-center gap-1 text-xs text-fm-danger">
                  <AlertTriangle className="h-3 w-3" />
                  Genre mismatch
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'artist_genres',
        label: 'Genres',
        sortable: false,
        render: (submission: ScreeningSubmissionWithDetails) => {
          const artistGenres = submission.artists?.artist_genres ?? [];
          const venueRequiredGenreIds =
            submission.venues?.venue_required_genres?.map(vrg => vrg.genre_id) ?? [];

          const badges = artistGenres.map(ag => ({
            id: ag.genre_id,
            label: ag.genre.name,
            // Gold for venue-matching genres, secondary otherwise
            variant: venueRequiredGenreIds.includes(ag.genre_id)
              ? ('primary' as const)
              : ('secondary' as const),
          }));

          return (
            <FmCommonBadgeGroup
              badges={badges}
              maxDisplay={3}
              gap='sm'
              wrap={false}
            />
          );
        },
      },
      {
        key: 'tags',
        label: 'Tags',
        sortable: false,
        render: (submission: ScreeningSubmissionWithDetails) => {
          const badges =
            submission.submission_tags?.map(st => ({
              id: st.tag_id,
              label: st.tag.name,
              variant: 'secondary' as const,
              className: st.tag.color
                ? `border-[${st.tag.color}] text-[${st.tag.color}]`
                : undefined,
            })) ?? [];

          return (
            <FmCommonBadgeGroup
              badges={badges}
              maxDisplay={2}
              gap='sm'
              wrap={false}
            />
          );
        },
      },
      {
        key: 'recording',
        label: 'Recording',
        sortable: false,
        render: (submission: ScreeningSubmissionWithDetails) => (
          <div className="flex items-center gap-[10px]">
            <span className="text-lg">
              {getPlatformIcon(submission.artist_recordings.platform)}
            </span>
            <div>
              <div className="font-medium text-white">
                {submission.artist_recordings.name}
              </div>
              {submission.artist_recordings.duration_seconds && (
                <div className="text-xs text-muted-foreground">
                  {formatTimeDisplay(
                    submission.artist_recordings.duration_seconds
                  )}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'context',
        label: 'Context',
        sortable: true,
        render: (submission: ScreeningSubmissionWithDetails) => {
          if (submission.context_type === 'event' && submission.events) {
            return (
              <div className="text-sm">
                <div className="text-white/80">Event</div>
                <div className="text-xs text-muted-foreground">
                  {submission.events.title}
                </div>
              </div>
            );
          }
          if (submission.context_type === 'venue' && submission.venues) {
            return (
              <div className="text-sm">
                <div className="text-white/80">Venue</div>
                <div className="text-xs text-muted-foreground">
                  {submission.venues.name}
                </div>
              </div>
            );
          }
          return (
            <div className="text-sm text-white/80">
              General
            </div>
          );
        },
      },
      {
        key: 'submitted',
        label: 'Submitted',
        sortable: true,
        render: (submission: ScreeningSubmissionWithDetails) => {
          const date = new Date(submission.created_at);
          return (
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString()}
            </div>
          );
        },
      },
      {
        key: 'reviews',
        label: 'Reviews',
        sortable: true,
        render: (submission: ScreeningSubmissionWithDetails) => {
          const reviewCount =
            submission.submission_scores?.review_count ?? 0;
          const avgRating =
            submission.submission_scores?.raw_avg_score ?? null;

          return (
            <div className="flex items-center gap-[10px]">
              <div className="text-sm text-white">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </div>
              {avgRating !== null && (
                <div
                  className={cn(
                    'text-sm font-medium',
                    'blur-[1px] hover:blur-none transition-all'
                  )}
                  title="Hover to reveal average rating"
                >
                  ⭐ {avgRating.toFixed(1)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'score',
        label: 'Score',
        sortable: true,
        render: (submission: ScreeningSubmissionWithDetails) => {
          const indexedScore =
            submission.submission_scores?.indexed_score ?? null;
          const hotScore =
            submission.submission_scores?.hot_indexed_score ?? null;

          if (indexedScore === null) {
            return <div className="text-sm text-muted-foreground">—</div>;
          }

          return (
            <div className="flex items-center gap-[10px]">
              <div className="text-lg font-bold text-fm-gold">
                {indexedScore}
              </div>
              {hotScore !== null && hotScore !== indexedScore && (
                <div className="text-xs text-white/60 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {hotScore}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (submission: ScreeningSubmissionWithDetails) => (
          <Badge
            className={cn(
              'rounded-none text-xs font-medium border',
              getStatusColor(submission.status)
            )}
          >
            {submission.status.toUpperCase()}
          </Badge>
        ),
      },
    ],
    []
  );

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!submissionToDelete) return;

    await deleteSubmission(submissionToDelete.id);
    setSubmissionToDelete(null);
    refetch(); // Refresh the list
  };

  // Context menu actions
  const actions = useMemo<
    DataGridAction<ScreeningSubmissionWithDetails>[]
  >(
    () => [
      {
        label: 'Review Submission',
        icon: <Star className="h-4 w-4" />,
        onClick: submission => navigate(`/staff/screening/review/${submission.id}`),
      },
      {
        label: 'View Artist Profile',
        icon: <User className="h-4 w-4" />,
        onClick: submission => navigate(`/artists/${submission.artist_id}`),
      },
      {
        label: 'Open Recording',
        icon: <ExternalLink className="h-4 w-4" />,
        onClick: submission => {
          window.open(
            submission.artist_recordings.url,
            '_blank',
            'noopener,noreferrer'
          );
        },
        separator: true, // Add separator after this action
      },
      {
        label: showIgnored ? 'Restore Submission' : 'Ignore Submission',
        icon: showIgnored ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
        onClick: async submission => {
          try {
            if (showIgnored) {
              await unignoreSubmission(submission.id);
              toast.success(tToast('submissions.submissionRestored', 'Submission restored to your feed'));
            } else {
              await ignoreSubmission(submission.id);
              toast.success(tToast('submissions.submissionIgnored', 'Submission hidden from your feed'));
            }
            refetch();
          } catch (error) {
            // Error handled by service
          }
        },
        separator: canDelete, // Add separator only if delete action follows
      },
      ...(canDelete ? [
        {
          label: 'Delete Permanently',
          icon: <Trash className="h-4 w-4" />,
          onClick: (submission: ScreeningSubmissionWithDetails) => {
            setSubmissionToDelete(submission);
            setDeleteModalOpen(true);
          },
          variant: 'destructive' as const,
        },
      ] : []),
    ],
    [navigate, showIgnored, canDelete, tToast, refetch]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-[20px]">
          Failed to load submissions
        </p>
        <FmCommonButton
          variant="default"
          onClick={() => window.location.reload()}
        >
          Retry
        </FmCommonButton>
      </div>
    );
  }

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="h-16 w-16 mx-auto text-fm-gold/40 mb-[20px]" />
        <h3 className="text-xl text-white/60 font-canela mb-[10px]">
          No submissions found.
        </h3>
        <p className="text-sm text-white/40">
          {filters.status === 'pending'
            ? 'All pending submissions have been reviewed.'
            : 'Try adjusting your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[20px]">
      {/* Filter Controls */}
      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="flex items-center gap-[10px]">
          <span className="text-sm text-muted-foreground uppercase">
            Status:
          </span>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <FmCommonButton
              key={status}
              variant="default"
              size="sm"
              onClick={() =>
                setFilters(prev => ({
                  ...prev,
                  status: status === 'all' ? undefined : status,
                }))
              }
              className={cn(
                filters.status === status ||
                  (status === 'all' && !filters.status)
                  ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                  : ''
              )}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </FmCommonButton>
          ))}
        </div>

        <div className="flex items-center gap-[10px] ml-auto">
          <span className="text-sm text-muted-foreground uppercase">
            Sort:
          </span>
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                sortBy: 'created_at',
                sortDirection: 'asc',
              }))
            }
            className={cn(
              filters.sortBy === 'created_at'
                ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                : ''
            )}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Oldest First
          </FmCommonButton>
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                sortBy: 'indexed_score',
                sortDirection: 'desc',
              }))
            }
            className={cn(
              filters.sortBy === 'indexed_score'
                ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                : ''
            )}
          >
            <Star className="h-4 w-4 mr-1" />
            Highest Score
          </FmCommonButton>
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={() => setShowIgnored(!showIgnored)}
            className={cn(
              showIgnored
                ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                : ''
            )}
          >
            {showIgnored ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            {showIgnored ? 'Showing Ignored' : 'Show Ignored'}
          </FmCommonButton>
        </div>
      </div>

      {/* Data Grid */}
      <FmConfigurableDataGrid
        gridId="screening-queue"
        data={submissions}
        columns={columns}
        actions={actions}
      />

      {/* Delete Confirmation Modal */}
      <DeleteSubmissionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        submission={submissionToDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
