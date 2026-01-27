/**
 * Screening Queue View
 *
 * Displays submission queue as a social media-style feed.
 * Features filtering, sorting, and inline actions.
 * Responsive design using ScreeningFeedCard for both mobile and desktop.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Music,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { cn } from '@/shared';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { useAuthSafe } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
import { useScreeningSubmissions, useScreeningConfig } from '../hooks';
import {
  deleteSubmission,
  ignoreSubmission,
  unignoreSubmission,
  approveSubmission,
  rejectSubmission,
} from '../services/submissionService';
import { DeleteSubmissionModal } from './DeleteSubmissionModal';
import { ScreeningFeedCard } from './ScreeningFeedCard';
import { ScreeningFeedSkeletonList } from './ScreeningFeedCardSkeleton';
import type {
  ScreeningSubmissionWithDetails,
  SubmissionContext,
  SubmissionFilters,
} from '../types';
import type { Genre } from '@/features/artists/types';

// ============================================================================
// Types
// ============================================================================

// No props needed - component manages its own state

// ============================================================================
// Main Component
// ============================================================================

export function ScreeningQueueView() {
  const navigate = useNavigate();
  const { t: tToast } = useTranslation('toasts');
  const auth = useAuthSafe();
  const currentUserId = auth?.user?.id ?? null;
  const { isAdmin, hasRole } = useUserPermissions();
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  const isFmStaff = hasRole(ROLES.FM_STAFF);
  const canDelete = isAdmin() || isDeveloper;
  const canApproveReject = isAdmin() || isDeveloper || isFmStaff;

  // Get screening config for minimum reviews requirement
  const { data: screeningConfig } = useScreeningConfig();
  const minReviewsForDecision = screeningConfig?.min_reviews_for_approval ?? 2;

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] =
    useState<ScreeningSubmissionWithDetails | null>(null);

  // Show ignored toggle
  const [showIgnored, setShowIgnored] = useState(false);

  // Mobile filter panel state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Genre filter state
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  // Date range filter
  const [dateRange, setDateRange] = useState<string>('all');

  // Queue context filter
  const [queueContext, setQueueContext] = useState<SubmissionContext | 'all'>('all');

  // Calculate date filter from range
  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '6months':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }, [dateRange]);

  // Filters
  const [filters, setFilters] = useState<SubmissionFilters>({
    context: undefined,
    status: 'pending', // Default to pending submissions
    sortBy: 'created_at',
    sortDirection: 'asc', // FIFO (oldest first)
    excludeIgnored: !showIgnored, // Exclude ignored by default
  });

  // Update exclude ignored when toggle changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, excludeIgnored: !showIgnored }));
  }, [showIgnored]);

  // Update date filter when range changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, dateFrom: dateFilter }));
  }, [dateFilter]);

  // Update context filter when queue context changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      context: queueContext === 'all' ? undefined : queueContext,
    }));
  }, [queueContext]);

  // Fetch submissions
  const {
    data: allSubmissions = [],
    isLoading,
    error,
    refetch,
  } = useScreeningSubmissions(filters);

  // Filter submissions based on user's review status
  const { submissions, soloReviews } = useMemo(() => {
    if (!currentUserId) {
      return { submissions: allSubmissions, soloReviews: [] };
    }

    const reviewable: ScreeningSubmissionWithDetails[] = [];
    const solo: ScreeningSubmissionWithDetails[] = [];

    for (const submission of allSubmissions) {
      const reviews = submission.screening_reviews || [];
      const userReview = reviews.find(r => r.reviewer_id === currentUserId);

      if (userReview) {
        // User has reviewed this submission
        if (reviews.length === 1) {
          // Only the user has reviewed - this is a "solo review"
          solo.push(submission);
        }
        // If there are multiple reviews (including user's), it should be in analysis
        // Don't show it in either queue
      } else {
        // User hasn't reviewed - show in main queue
        reviewable.push(submission);
      }
    }

    return { submissions: reviewable, soloReviews: solo };
  }, [allSubmissions, currentUserId]);

  // Ignore/unignore handler
  const handleIgnoreToggle = async (submission: ScreeningSubmissionWithDetails) => {
    try {
      if (showIgnored) {
        await unignoreSubmission(submission.id);
        toast.success(
          tToast('submissions.submissionRestored', 'Submission restored to your feed')
        );
      } else {
        await ignoreSubmission(submission.id);
        toast.success(
          tToast('submissions.submissionIgnored', 'Submission hidden from your feed')
        );
      }
      refetch();
    } catch {
      // Error handled by service
    }
  };

  // Approve handler
  const handleApprove = async (submission: ScreeningSubmissionWithDetails) => {
    try {
      await approveSubmission(submission.id);
      toast.success(tToast('submissions.submissionApproved', 'Submission approved'));
      refetch();
    } catch {
      // Error handled by service
    }
  };

  // Reject handler
  const handleReject = async (submission: ScreeningSubmissionWithDetails) => {
    try {
      await rejectSubmission(submission.id);
      toast.success(tToast('submissions.submissionRejected', 'Submission rejected'));
      refetch();
    } catch {
      // Error handled by service
    }
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!submissionToDelete) return;

    await deleteSubmission(submissionToDelete.id);
    setSubmissionToDelete(null);
    refetch();
  };

  // Check if submission is eligible for approve/reject
  const isEligibleForDecision = (submission: ScreeningSubmissionWithDetails): boolean => {
    const reviewCount = submission.submission_scores?.review_count ?? 0;
    return (
      canApproveReject &&
      submission.status === 'pending' &&
      reviewCount >= minReviewsForDecision
    );
  };

  // State for solo reviews section collapse
  const [showSoloReviews, setShowSoloReviews] = useState(true);

  // Render a submission card
  const renderSubmissionCard = (submission: ScreeningSubmissionWithDetails) => (
    <ScreeningFeedCard
      key={submission.id}
      submission={submission}
      showIgnored={showIgnored}
      canApproveReject={isEligibleForDecision(submission)}
      onReview={() => navigate(`/staff/screening/review/${submission.id}`)}
      onOpenRecording={() => {
        const url = submission.artist_recordings?.url;
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }}
      onViewArtist={() => navigate(`/artists/${submission.artist_id}`)}
      onIgnore={() => handleIgnoreToggle(submission)}
      onApprove={
        isEligibleForDecision(submission)
          ? () => handleApprove(submission)
          : undefined
      }
      onReject={
        isEligibleForDecision(submission)
          ? () => handleReject(submission)
          : undefined
      }
      onDelete={
        canDelete
          ? () => {
              setSubmissionToDelete(submission);
              setDeleteModalOpen(true);
            }
          : undefined
      }
    />
  );

  // Content component for different states
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return <ScreeningFeedSkeletonList count={3} />;
    }

    // Error state
    if (error) {
      return (
        <FmCommonCard variant="frosted" className="p-[20px] text-center">
          <p className="text-muted-foreground mb-[20px]">Failed to load submissions</p>
          <FmCommonButton variant="default" onClick={() => refetch()}>
            Retry
          </FmCommonButton>
        </FmCommonCard>
      );
    }

    const hasSubmissions = submissions.length > 0;
    const hasSoloReviews = soloReviews.length > 0;

    // Complete empty state
    if (!hasSubmissions && !hasSoloReviews) {
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

    return (
      <div className="space-y-[20px]">
        {/* Main Queue */}
        {hasSubmissions && (
          <div className="space-y-[10px] md:space-y-[15px]">
            {submissions.map(renderSubmissionCard)}
          </div>
        )}

        {/* Empty main queue but has solo reviews */}
        {!hasSubmissions && hasSoloReviews && (
          <FmCommonCard variant="frosted" className="p-[20px] text-center">
            <p className="text-sm text-white/60">
              No new submissions to review. Your solo reviews are below.
            </p>
          </FmCommonCard>
        )}

        {/* Solo Reviews Section */}
        {hasSoloReviews && (
          <div className="border-t border-white/10 pt-[20px]">
            <button
              onClick={() => setShowSoloReviews(!showSoloReviews)}
              className="flex items-center gap-[10px] w-full text-left mb-[15px] group"
            >
              <div className="flex-1">
                <h3 className="text-sm font-medium text-fm-gold uppercase tracking-wider">
                  Awaiting Second Review
                </h3>
                <p className="text-xs text-white/50 mt-[5px]">
                  {soloReviews.length} submission{soloReviews.length !== 1 ? 's' : ''} you reviewed, waiting for another reviewer
                </p>
              </div>
              {showSoloReviews ? (
                <ChevronUp className="h-4 w-4 text-white/50 group-hover:text-white" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white" />
              )}
            </button>

            {showSoloReviews && (
              <div className="space-y-[10px] md:space-y-[15px]">
                {soloReviews.map(renderSubmissionCard)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Queue context dropdown options
  const queueOptions = [
    { value: 'all', label: 'All Queues' },
    { value: 'general', label: 'General' },
    { value: 'event', label: 'Events' },
    { value: 'venue', label: 'Venues' },
  ];

  // Status dropdown options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  // Sort dropdown options
  const sortOptions = [
    { value: 'created_at_asc', label: 'Oldest First' },
    { value: 'created_at_desc', label: 'Newest First' },
    { value: 'indexed_score_desc', label: 'Highest Score' },
    { value: 'indexed_score_asc', label: 'Lowest Score' },
    { value: 'review_count_desc', label: 'Most Reviews' },
  ];

  // Date range dropdown options
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: '6months', label: 'Last 6 Months' },
  ];

  // Get current sort value
  const currentSortValue = `${filters.sortBy}_${filters.sortDirection}`;

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split('_') as [
      'created_at' | 'indexed_score' | 'review_count',
      'asc' | 'desc'
    ];
    setFilters(prev => ({ ...prev, sortBy, sortDirection }));
  };

  // Filter controls component (vertical layout for sidebar and mobile)
  const FilterControls = () => (
    <div className="flex flex-col gap-[10px]">
      {/* Queue Context */}
      <FmCommonSelect
        label="Queue"
        value={queueContext}
        onChange={value => setQueueContext(value as SubmissionContext | 'all')}
        options={queueOptions}
        className="w-full"
      />

      {/* Status */}
      <FmCommonSelect
        label="Status"
        value={filters.status || 'all'}
        onChange={value =>
          setFilters(prev => ({
            ...prev,
            status: value === 'all' ? undefined : (value as 'pending' | 'approved' | 'rejected'),
          }))
        }
        options={statusOptions}
        className="w-full"
      />

      {/* Sort */}
      <FmCommonSelect
        label="Sort"
        value={currentSortValue}
        onChange={handleSortChange}
        options={sortOptions}
        className="w-full"
      />

      {/* Date Range */}
      <FmCommonSelect
        label="Date"
        value={dateRange}
        onChange={setDateRange}
        options={dateRangeOptions}
        className="w-full"
      />

      {/* Genre Filter */}
      <div className="w-full">
        <FmGenreMultiSelect
          selectedGenres={selectedGenres}
          onChange={setSelectedGenres}
          maxGenres={3}
          label="Genres"
        />
      </div>

      {/* Show Ignored Toggle */}
      <FmCommonButton
        variant="default"
        size="sm"
        onClick={() => setShowIgnored(!showIgnored)}
        className={cn(
          'h-9 w-full justify-center',
          showIgnored && 'bg-fm-gold/20 border-fm-gold text-fm-gold'
        )}
      >
        {showIgnored ? (
          <Eye className="h-4 w-4 mr-[5px]" />
        ) : (
          <EyeOff className="h-4 w-4 mr-[5px]" />
        )}
        {showIgnored ? 'Ignored' : 'Show Ignored'}
      </FmCommonButton>

      {/* Submission Count */}
      <div className="text-xs text-muted-foreground pt-[10px] border-t border-white/10 space-y-1">
        <div>{submissions.length} to review</div>
        {soloReviews.length > 0 && (
          <div className="text-fm-gold/70">
            {soloReviews.length} awaiting 2nd review
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden space-y-[15px]">
        {/* Mobile Filter Toggle */}
        <div className="px-[10px]">
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
              <FilterControls />
            </FmCommonCard>
          )}
        </div>

        {/* Mobile Content */}
        <div className="px-[10px]">
          {renderContent()}
        </div>
      </div>

      {/* Desktop Layout: Sidebar + Feed */}
      <div className="hidden md:flex gap-[20px]">
        {/* Left Sidebar: Filter Controls */}
        <aside className="w-[200px] flex-shrink-0">
          <div className="sticky top-[20px] bg-black/40 border border-white/10 p-[15px]">
            <FilterControls />
          </div>
        </aside>

        {/* Right Content: Feed */}
        <div className="flex-1 max-w-2xl">
          {renderContent()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteSubmissionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        submission={submissionToDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
