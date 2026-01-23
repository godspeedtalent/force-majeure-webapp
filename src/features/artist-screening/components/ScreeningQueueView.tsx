/**
 * Screening Queue View
 *
 * Displays submission queue with filtering, sorting, and context menu actions.
 * Uses FmConfigurableDataGrid for desktop and card-based layout for mobile.
 * Responsive design with collapsible filters on mobile.
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Music,
  User,
  Star,
  AlertTriangle,
  EyeOff,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { DataGridColumn, DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
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
function getStatusColor(status: SubmissionStatus | undefined): string {
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
  platform: string | undefined
): string {
  switch (platform) {
    case 'spotify':
      return '🎵';
    case 'soundcloud':
      return '☁️';
    case 'youtube':
      return '▶️';
    default:
      return '🎧';
  }
}

// ============================================================================
// Mobile Submission Card Component
// ============================================================================

interface MobileSubmissionCardProps {
  submission: ScreeningSubmissionWithDetails;
  onReview: () => void;
  onOpenRecording: () => void;
  onIgnore: () => void;
  onDelete?: () => void;
  showIgnored: boolean;
  canDelete: boolean;
}

function MobileSubmissionCard({
  submission,
  onReview,
  onOpenRecording,
  onIgnore,
  onDelete,
  showIgnored,
  canDelete,
}: MobileSubmissionCardProps) {
  const reviewCount = submission.submission_scores?.review_count ?? 0;
  const indexedScore = submission.submission_scores?.indexed_score ?? null;

  return (
    <FmCommonCard variant="frosted" className="p-0 overflow-hidden">
      {/* Two-column layout: Image | Content */}
      <div className="flex">
        {/* Artist Image Column */}
        <div className="flex-shrink-0">
          {submission.artists?.image_url ? (
            <img
              src={submission.artists.image_url}
              alt={submission.artists?.name || 'Artist'}
              className="h-full w-24 object-cover rounded-none"
              style={{ minHeight: '160px' }}
            />
          ) : (
            <div
              className="w-24 bg-white/10 flex items-center justify-center rounded-none"
              style={{ minHeight: '160px' }}
            >
              <User className="h-10 w-10 text-white/40" />
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 p-[15px] min-w-0">
          {/* Header Row: Name + Status */}
          <div className="flex items-start justify-between gap-[10px] mb-[10px]">
            <div className="min-w-0">
              <div className="font-medium text-white truncate">
                {submission.artists?.name || 'Unknown Artist'}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {submission.artist_recordings?.name || 'Unknown Recording'}
              </div>
            </div>
            <Badge
              className={cn(
                'rounded-none text-xs font-medium border flex-shrink-0',
                getStatusColor(submission.status ?? 'pending')
              )}
            >
              {(submission.status ?? 'pending').toUpperCase()}
            </Badge>
          </div>

          {/* Genre Mismatch Warning */}
          {submission.has_genre_mismatch && (
            <div className="flex items-center gap-[5px] text-xs text-fm-danger mb-[10px]">
              <AlertTriangle className="h-3 w-3" />
              Genre mismatch
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm mb-[10px] pb-[10px] border-b border-white/10">
            <div className="flex items-center gap-[10px]">
              <div className="text-muted-foreground text-xs">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </div>
              {indexedScore !== null && (
                <div className="flex items-center gap-[5px]">
                  <Star className="h-3 w-3 text-fm-gold" />
                  <span className="font-bold text-fm-gold text-sm">{indexedScore}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(submission.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Context Info */}
          {(submission.context_type === 'event' || submission.context_type === 'venue') && (
            <div className="text-[10px] text-muted-foreground mb-[10px]">
              {submission.context_type === 'event' && submission.events && (
                <span>Event: {submission.events.title}</span>
              )}
              {submission.context_type === 'venue' && submission.venues && (
                <span>Venue: {submission.venues.name}</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-[8px]">
            <FmCommonButton
              variant="gold"
              size="sm"
              onClick={onReview}
              className="flex-1"
            >
              <Star className="h-3 w-3 mr-1" />
              Review
            </FmCommonButton>
            <FmCommonIconButton
              variant="default"
              size="sm"
              onClick={onOpenRecording}
              icon={ExternalLink}
              tooltip="Open recording"
            />
            <FmCommonIconButton
              variant="default"
              size="sm"
              onClick={onIgnore}
              icon={showIgnored ? Eye : EyeOff}
              tooltip={showIgnored ? 'Restore' : 'Ignore'}
            />
            {canDelete && onDelete && (
              <FmCommonIconButton
                variant="destructive"
                size="sm"
                onClick={onDelete}
                icon={Trash2}
                tooltip="Delete"
              />
            )}
          </div>
        </div>
      </div>
    </FmCommonCard>
  );
}

// ============================================================================
// Main Component
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

  // Mobile filter panel state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  // Ignore/unignore handler
  const handleIgnoreToggle = async (submission: ScreeningSubmissionWithDetails) => {
    try {
      if (showIgnored) {
        await unignoreSubmission(submission.id);
        toast.success(tToast('submissions.submissionRestored', 'Submission restored to your feed'));
      } else {
        await ignoreSubmission(submission.id);
        toast.success(tToast('submissions.submissionIgnored', 'Submission hidden from your feed'));
      }
      refetch();
    } catch {
      // Error handled by service
    }
  };

  // Column definitions for desktop data grid
  const columns = useMemo<DataGridColumn<ScreeningSubmissionWithDetails>[]>(
    () => [
      {
        key: 'image',
        label: '',
        sortable: false,
        width: '80px',
        cellClassName: 'p-0',
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => (
          submission.artists?.image_url ? (
            <img
              src={submission.artists.image_url}
              alt={submission.artists?.name || 'Artist'}
              className="h-16 w-16 object-cover rounded-none"
            />
          ) : (
            <div className="h-16 w-16 bg-white/10 flex items-center justify-center rounded-none">
              <User className="h-8 w-8 text-white/40" />
            </div>
          )
        ),
      },
      {
        key: 'artist',
        label: 'Artist',
        sortable: true,
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => (
          <div>
            <div className="font-medium text-white">
              {submission.artists?.name || 'Unknown Artist'}
            </div>
            {submission.has_genre_mismatch && (
              <div className="flex items-center gap-1 text-xs text-fm-danger">
                <AlertTriangle className="h-3 w-3" />
                Genre mismatch
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'artist_genres',
        label: 'Genres',
        sortable: false,
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => {
          const artistGenres = submission.artists?.artist_genres ?? [];
          const venueRequiredGenreIds =
            submission.venues?.venue_required_genres?.map(vrg => vrg.genre_id) ?? [];

          const badges = artistGenres
            .filter(ag => ag.genre?.name) // Filter out any with missing genre data
            .map(ag => ({
              id: ag.genre_id,
              label: ag.genre.name,
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => {
          const badges =
            submission.submission_tags
              ?.filter(st => st.tag?.name) // Filter out any with missing tag data
              .map(st => ({
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => (
          <div className="flex items-center gap-[10px]">
            <span className="text-lg">
              {getPlatformIcon(submission.artist_recordings?.platform || 'unknown')}
            </span>
            <div>
              <div className="font-medium text-white">
                {submission.artist_recordings?.name || 'Unknown Recording'}
              </div>
              {submission.artist_recordings?.duration_seconds && (
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => {
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => {
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => {
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => {
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
        render: (_value: unknown, submission: ScreeningSubmissionWithDetails) => (
          <Badge
            className={cn(
              'rounded-none text-xs font-medium border',
              getStatusColor(submission.status ?? 'pending')
            )}
          >
            {(submission.status ?? 'pending').toUpperCase()}
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
    refetch();
  };

  // Context menu actions for desktop
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
          const url = submission.artist_recordings?.url;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        },
        separator: true,
      },
      {
        label: showIgnored ? 'Restore Submission' : 'Ignore Submission',
        icon: showIgnored ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />,
        onClick: handleIgnoreToggle,
        separator: canDelete,
      },
      ...(canDelete ? [
        {
          label: 'Delete Permanently',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: (submission: ScreeningSubmissionWithDetails) => {
            setSubmissionToDelete(submission);
            setDeleteModalOpen(true);
          },
          variant: 'destructive' as const,
        },
      ] : []),
    ],
    [navigate, showIgnored, canDelete, handleIgnoreToggle]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px]">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <FmCommonCard variant="frosted" className="p-[20px] text-center">
        <p className="text-muted-foreground mb-[20px]">
          Failed to load submissions
        </p>
        <FmCommonButton
          variant="default"
          onClick={() => window.location.reload()}
        >
          Retry
        </FmCommonButton>
      </FmCommonCard>
    );
  }

  // Empty state
  if (submissions.length === 0) {
    return (
      <FmCommonCard variant="frosted" className="p-[40px] text-center">
        <Music className="h-12 w-12 md:h-16 md:w-16 mx-auto text-fm-gold/40 mb-[15px] md:mb-[20px]" />
        <h3 className="text-lg md:text-xl text-white/60 font-canela mb-[10px]">
          No submissions found.
        </h3>
        <p className="text-sm text-white/40">
          {filters.status === 'pending'
            ? 'All pending submissions have been reviewed.'
            : 'Try adjusting your filters.'}
        </p>
      </FmCommonCard>
    );
  }

  // Filter controls component (shared between mobile and desktop)
  const FilterControls = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      'flex gap-[10px]',
      isMobile ? 'flex-col' : 'flex-wrap items-center'
    )}>
      {/* Status Filter */}
      <div className={cn(
        'flex items-center gap-[10px]',
        isMobile && 'flex-wrap'
      )}>
        <span className="text-xs md:text-sm text-muted-foreground uppercase">
          Status:
        </span>
        <div className="flex gap-[5px] flex-wrap">
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
      </div>

      {/* Sort & Show Ignored */}
      <div className={cn(
        'flex items-center gap-[10px]',
        !isMobile && 'ml-auto',
        isMobile && 'flex-wrap'
      )}>
        <span className="text-xs md:text-sm text-muted-foreground uppercase">
          Sort:
        </span>
        <div className="flex gap-[5px] flex-wrap">
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
            Oldest
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
            Score
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
            {showIgnored ? 'Ignored' : 'Hidden'}
          </FmCommonButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-[15px] md:space-y-[20px]">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden">
        <FmCommonButton
          variant="default"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-[10px]">
            <Filter className="h-4 w-4" />
            Filters
          </span>
          {showMobileFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </FmCommonButton>

        {/* Mobile Filter Panel */}
        {showMobileFilters && (
          <FmCommonCard variant="frosted" className="p-[15px] mt-[10px]">
            <FilterControls isMobile />
          </FmCommonCard>
        )}
      </div>

      {/* Desktop Filter Controls */}
      <div className="hidden md:block">
        <FilterControls />
      </div>

      {/* Submission Count */}
      <div className="text-xs text-muted-foreground">
        {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-[10px]">
        {submissions.map(submission => (
          <MobileSubmissionCard
            key={submission.id}
            submission={submission}
            onReview={() => navigate(`/staff/screening/review/${submission.id}`)}
            onOpenRecording={() => {
              const url = submission.artist_recordings?.url;
              if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            }}
            onIgnore={() => handleIgnoreToggle(submission)}
            onDelete={canDelete ? () => {
              setSubmissionToDelete(submission);
              setDeleteModalOpen(true);
            } : undefined}
            showIgnored={showIgnored}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Desktop Data Grid */}
      <div className="hidden md:block">
        <FmConfigurableDataGrid
          gridId="screening-queue"
          data={submissions}
          columns={columns}
          actions={actions}
        />
      </div>

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
