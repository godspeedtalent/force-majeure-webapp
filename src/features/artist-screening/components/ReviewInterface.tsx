/**
 * Review Interface
 *
 * Full-screen review experience for staff to evaluate artist submissions.
 * This redesign emphasizes historical reviews and the current reviewer's controls.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Star,
  User,
  AlertTriangle,
  Music,
  ArrowLeft,
  MoreHorizontal,
  EyeOff,
  Trash,
  Tags,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronsDown,
  Minus,
  ChevronsUp,
  Pencil,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { ReviewInterfaceMobile } from './ReviewInterfaceMobile';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Badge } from '@/components/common/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/shadcn/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { cn, handleError } from '@/shared';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { useAuthSafe } from '@/features/auth/services/AuthContext';
import { useFmToolbarSafe } from '@/shared/contexts/FmToolbarContext';
import { toast } from 'sonner';
import {
  useSubmission,
  useCreateReview,
  useDeleteReview,
  useReviewTimer,
} from '../hooks';
import { ignoreSubmission, deleteSubmission } from '../services/submissionService';
import { REVIEW_METRIC_CONFIGS } from '../config/reviewMetrics';
import { calculateTotalScore, createDefaultMetricScores } from '../utils/reviewScoring';
import { TimerSwitchConfirm } from './ReviewTimer';
import { QualitativeMetricSelector } from './QualitativeMetricSelector';
import type {
  CreateReviewInput,
  ReviewMetricId,
  ReviewMetricScores,
  ScreeningReview,
  SubmissionStatus,
} from '../types';
import { FmTagMultiSelect } from '@/features/tagging/components/FmTagMultiSelect';
import { applyTagToSubmission, removeTagFromSubmission } from '@/features/tagging/services/tagService';
import type { Tag } from '@/features/tagging/types';
import {
  FmCommonContextMenu,
  type ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';

const STATUS_THEMES: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-200 border-red-500/30',
};

const PLATFORM_LABELS: Record<string, string> = {
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  youtube: 'YouTube',
};
export function ReviewInterface() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const auth = useAuthSafe();
  const currentUserId = auth?.user?.id ?? null;
  const { isAdmin, hasRole } = useUserPermissions();
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  const canDelete = isAdmin() || isDeveloper;
  const { openTab } = useFmToolbarSafe();

  const { data: submission, isLoading, error } = useSubmission(id!);

  // Render mobile version on mobile devices
  if (isMobile && id) {
    return <ReviewInterfaceMobile submissionId={id} />;
  }

  const {
    timerState,
    remainingSeconds,
    isTimerActive,
    pendingRequest,
    requestTimer,
    confirmPendingTimer,
    cancelPendingRequest,
    cancelTimer,
    relaunchRecording,
    isTimerCompleted,
    clearCompletedTimer,
  } = useReviewTimer();

  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();

  // UI state
  const [showDetails, setShowDetails] = useState(true);

  // Form state
  const [metricScores, setMetricScores] = useState<ReviewMetricScores>(() =>
    createDefaultMetricScores()
  );
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const totalMetricScore = useMemo(
    () => calculateTotalScore(metricScores),
    [metricScores]
  );

  const coverArt =
    submission?.artist_recordings?.cover_art || submission?.artists?.image_url || null;

  const heroStyles: CSSProperties | undefined = coverArt
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(6,6,10,0.95), rgba(6,6,10,0.65)), url(${coverArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const hasReviewed = currentUserId
    ? submission?.screening_reviews?.some(review => review.reviewer_id === currentUserId)
    : false;

  const reviewCount = submission?.submission_scores?.review_count ?? 0;
  const canReview = id ? isTimerCompleted(id) : false;
  const indexedScore = submission?.submission_scores?.indexed_score;

  const reviewStats = useMemo(() => {
    if (!submission) {
      return {
        sortedReviews: [] as ScreeningReview[],
        mostRecentReviewAt: null as string | null,
      };
    }

    const sortedReviews = [...submission.screening_reviews].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return {
      sortedReviews,
      mostRecentReviewAt: sortedReviews[0]?.created_at ?? null,
    };
  }, [submission]);

  const mostRecentReviewDisplay = reviewStats.mostRecentReviewAt
    ? formatDistanceToNow(new Date(reviewStats.mostRecentReviewAt), { addSuffix: true })
    : 'Awaiting first review';

  const submissionDateLabel = submission
    ? new Date(submission.created_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const contextDescriptor = submission
    ? submission.context_type === 'event' && submission.events
      ? {
          label: 'Event Undercard',
          value: submission.events.title,
          extra: submission.events.start_time
            ? new Date(submission.events.start_time).toLocaleDateString()
            : undefined,
        }
      : submission.context_type === 'venue' && submission.venues
      ? {
          label: 'Venue Booking',
          value: submission.venues.name,
          extra: 'Direct request',
        }
      : { label: 'General Discovery', value: 'Open queue', extra: undefined }
    : null;

  const artistGenres =
    submission?.artists?.artist_genres?.map(entry => entry.genre?.name).filter(Boolean) ?? [];

  const submissionTags = submission?.submission_tags ?? [];

  useEffect(() => {
    setMetricScores(createDefaultMetricScores());
    setInternalNotes('');
    setSelectedTags(submissionTags.map(entry => entry.tag));
  }, [submission?.id]);

  const handleStartReview = () => {
    if (!submission) return;
    const result = requestTimer(
      submission.id,
      submission.artist_recordings.name,
      submission.artists.name,
      coverArt,
      submission.artist_recordings.url
    );
    // Open the toolbar to show timer status
    if (result === 'started') {
      openTab('screening-review');
    }
  };

  const handleMetricChange = (
    metricId: ReviewMetricId,
    score: ReviewMetricScores[ReviewMetricId]
  ) => {
    setMetricScores(previous => ({
      ...previous,
      [metricId]: score,
    }));
  };

  const handleTagsChange = async (nextTags: Tag[]) => {
    if (!submission) return;

    const previousTags = selectedTags;
    setSelectedTags(nextTags);

    const previousIds = new Set(previousTags.map(tag => tag.id));
    const nextIds = new Set(nextTags.map(tag => tag.id));

    const tagsToAdd = nextTags.filter(tag => !previousIds.has(tag.id));
    const tagsToRemove = previousTags.filter(tag => !nextIds.has(tag.id));

    if (tagsToAdd.length === 0 && tagsToRemove.length === 0) return;

    try {
      await Promise.all([
        ...tagsToAdd.map(tag => applyTagToSubmission(submission.id, tag.id)),
        ...tagsToRemove.map(tag => removeTagFromSubmission(submission.id, tag.id)),
      ]);
    } catch (err) {
      setSelectedTags(previousTags);
      handleError(err, {
        title: 'Failed to update tags',
        context: 'ReviewInterface.handleTagsChange',
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!submission || !canReview) return;

    try {
      const input: CreateReviewInput = {
        submission_id: submission.id,
        rating: totalMetricScore,
        metric_scores: metricScores,
        internal_notes: internalNotes || undefined,
        listen_duration_seconds: 1200,
      };

      await createReview.mutateAsync(input);

      // Clear the completed timer entry now that review is submitted
      clearCompletedTimer(submission.id);

      // Reset form state
      setMetricScores(createDefaultMetricScores());
      setInternalNotes('');
    } catch (err) {
      handleError(err, {
        title: 'Failed to submit review',
        context: 'ReviewInterface.handleSubmitReview',
      });
    }
  };

  const handleIgnore = async () => {
    if (!submission) return;

    try {
      await ignoreSubmission(submission.id);
      toast.success('Submission hidden from your feed');
      navigate('/staff?tab=dash_overview');
    } catch {
      // handled downstream
    }
  };

  const handleDelete = async () => {
    if (!submission || !canDelete) return;

    try {
      await deleteSubmission(submission.id);
      toast.success('Submission deleted');
      navigate('/staff?tab=dash_overview');
    } catch {
      // handled downstream
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!submission) return;

    try {
      await deleteReview.mutateAsync({
        review_id: reviewId,
        submission_id: submission.id,
      });
    } catch {
      // handled downstream
    }
  };

  const handleEditReview = (_reviewId: string) => {
    toast.info('Edit functionality coming soon');
    // TODO: Implement edit review modal
  };

  const getReviewContextActions = (
    review: ScreeningReview
  ): ContextMenuAction<ScreeningReview>[] => {
    // Only show context menu if this is the current user's review
    if (review.reviewer_id !== currentUserId) return [];

    return [
      {
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        onClick: r => handleEditReview(r.id),
      },
      {
        label: 'Delete',
        icon: <Trash className="h-4 w-4" />,
        onClick: r => handleDeleteReview(r.id),
        variant: 'destructive',
      },
    ];
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <FmCommonLoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !submission) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <p className="mb-5 text-muted-foreground">Submission not found</p>
          <FmCommonButton variant="default" onClick={() => navigate(-1)}>
            Go Back
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  const reviewLocked = !hasReviewed && reviewCount > 0;
  const platformLabel =
    PLATFORM_LABELS[submission.artist_recordings.platform] ??
    submission.artist_recordings.platform;
  const timerMinutesRemaining = Math.max(0, Math.floor(remainingSeconds / 60));
  const timerSecondsRemaining = Math.max(0, remainingSeconds % 60);
  return (
    <Layout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(214,193,141,0.08),_transparent_60%)] pb-16">
        {/* Header Row - Less Side Margin */}
        <div className="px-4 py-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <FmCommonButton
                variant="default"
                size="sm"
                onClick={() => navigate('/staff?tab=dash_overview')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Screenings
              </FmCommonButton>
              <Badge
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
                  STATUS_THEMES[submission.status]
                )}
              >
                {submission.status}
              </Badge>
              {contextDescriptor && (
                <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  {contextDescriptor.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-white/50">
                {reviewCount} peer reviews logged
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FmCommonIconButton
                    variant="default"
                    size="sm"
                    icon={MoreHorizontal}
                    tooltip="More actions"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-white/10 bg-black/95 text-white"
                >
                  <DropdownMenuItem
                    onClick={handleIgnore}
                    className="cursor-pointer hover:bg-white/10"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Ignore Submission
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="cursor-pointer text-fm-danger hover:bg-fm-danger/20"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Submission
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Single Column Layout - Centered Content */}
        <div className="mx-auto max-w-2xl space-y-6 px-4">
            {/* Hero Section */}
            <div
              className="border border-white/15 bg-black/60 backdrop-blur-sm p-6"
              style={heroStyles}
            >
              <div className="flex items-start gap-5">
                {/* Cover Art */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-white/15 bg-white/5">
                  {coverArt ? (
                    <img
                      src={coverArt}
                      alt={submission.artist_recordings.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/40">
                      <Music className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-white/50">Recording</p>
                  <h2 className="text-xl font-semibold text-white truncate">
                    {submission.artist_recordings.name}
                  </h2>
                  <button
                    onClick={() => navigate(`/artists/${submission.artist_id}`)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-6 w-6 border border-white/10">
                      <AvatarImage
                        src={submission.artists.image_url || ''}
                        alt={submission.artists.name}
                      />
                      <AvatarFallback className="bg-white/10 text-[10px] font-semibold text-white/70">
                        {submission.artists.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-fm-gold hover:underline">{submission.artists.name}</span>
                  </button>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {artistGenres.slice(0, 3).map(genre => (
                      <span
                        key={genre}
                        className="border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Indexed Score */}
                <div
                  className={cn(
                    'flex flex-col items-center justify-center border p-4 min-w-[100px] text-center',
                    indexedScore !== null && indexedScore !== undefined
                      ? 'border-fm-gold/30 bg-fm-gold/10'
                      : 'border-white/10 bg-white/5'
                  )}
                >
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Score</p>
                  {indexedScore !== null && indexedScore !== undefined ? (
                    <p className="text-3xl font-bold text-fm-gold">{Math.round(indexedScore)}</p>
                  ) : (
                    <p className="text-sm text-white/40">--</p>
                  )}
                  <p className="text-[10px] text-white/40">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Genre Mismatch Warning */}
              {submission.has_genre_mismatch && (
                <div className="mt-4 flex items-center gap-2 border border-fm-danger/30 bg-fm-danger/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-fm-danger flex-shrink-0" />
                  <p className="text-xs text-fm-danger">Genre mismatch with venue requirements</p>
                </div>
              )}

              {/* Show Details Toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-4 flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} details
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* Expandable Details */}
              {showDetails && (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-white/50 uppercase tracking-wider">Submitted</p>
                      <p className="text-white">{submissionDateLabel}</p>
                    </div>
                    <div>
                      <p className="text-white/50 uppercase tracking-wider">Last Review</p>
                      <p className="text-white">{mostRecentReviewDisplay}</p>
                    </div>
                    <div>
                      <p className="text-white/50 uppercase tracking-wider">Context</p>
                      <p className="text-white">{contextDescriptor?.value ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 uppercase tracking-wider">Platform</p>
                      <p className="text-white">{platformLabel}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider mb-2">
                      <Tags className="h-3 w-3" />
                      Tags
                    </div>
                    <FmTagMultiSelect
                      selectedTags={selectedTags}
                      onChange={handleTagsChange}
                      entityType="submission"
                      maxTags={10}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Timer / Review Controls Section - Toolbar Style */}
            <div
              className={cn(
                'border p-4',
                isTimerActive
                  ? 'border-fm-gold/30 bg-fm-gold/10'
                  : canReview && !hasReviewed
                  ? 'border-green-400/30 bg-green-500/10'
                  : hasReviewed
                  ? 'border-emerald-400/30 bg-emerald-500/10'
                  : 'border-white/10 bg-black/40'
              )}
            >
              {/* Timer Active State */}
              {isTimerActive && timerState && !canReview && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="h-3.5 w-3.5 text-fm-gold" fill="currentColor" />
                    <span className="text-[10px] font-medium text-fm-gold uppercase tracking-wider">
                      Now Playing
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={cn(
                        'text-2xl font-bold font-mono',
                        remainingSeconds < 60 ? 'text-fm-danger animate-pulse' : 'text-white'
                      )}
                    >
                      {timerMinutesRemaining}:{timerSecondsRemaining.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-white/40">
                      {Math.round(((1200 - remainingSeconds) / 1200) * 100)}% complete
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/10 mb-4">
                    <div
                      className="h-full bg-fm-gold transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.round(((1200 - remainingSeconds) / 1200) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FmCommonButton
                      variant="default"
                      size="sm"
                      onClick={relaunchRecording}
                      className="flex-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open Recording
                    </FmCommonButton>
                    <FmCommonButton
                      variant="default"
                      size="sm"
                      onClick={cancelTimer}
                      className="text-white/60"
                    >
                      Cancel
                    </FmCommonButton>
                  </div>
                </>
              )}

              {/* Ready to Review State */}
              {canReview && !hasReviewed && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">
                      Ready to Review
                    </span>
                  </div>

                  <div className="space-y-4">
                    {REVIEW_METRIC_CONFIGS.map(metric => (
                      <QualitativeMetricSelector
                        key={metric.id}
                        metric={metric}
                        value={metricScores[metric.id]}
                        onChange={score => handleMetricChange(metric.id, score)}
                      />
                    ))}
                  </div>

                  <FmCommonTextField
                    label="Internal Notes"
                    description="Only reviewers can see"
                    value={internalNotes}
                    onChange={event => setInternalNotes(event.target.value)}
                    placeholder="What stood out, deal-breakers, context..."
                    multiline
                    rows={3}
                    className="mt-4"
                  />

                  <FmCommonButton
                    variant="gold"
                    size="lg"
                    onClick={handleSubmitReview}
                    disabled={createReview.isPending}
                    className="w-full mt-4"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                  </FmCommonButton>
                </>
              )}

              {/* Already Reviewed State */}
              {hasReviewed && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm text-emerald-200">You have already reviewed this submission.</p>
                </div>
              )}

              {/* Not Started State */}
              {!isTimerActive && !canReview && !hasReviewed && (
                <>
                  <p className="text-sm text-white/70 mb-4">
                    Start the review timer to unlock scoring controls.
                  </p>
                  <div className="flex items-center gap-2">
                    <FmCommonButton
                      variant="gold"
                      size="lg"
                      onClick={handleStartReview}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Review Timer
                    </FmCommonButton>
                    <a
                      href={submission.artist_recordings.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Review History */}
            <div className="border border-white/10 bg-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white uppercase tracking-wider">
                    Review History
                  </span>
                  <span className="text-xs text-white/40">({reviewCount})</span>
                </div>
                {reviewLocked && (
                  <Badge className="border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                    Locked
                  </Badge>
                )}
              </div>
              <div className="relative p-4">
                {reviewCount === 0 ? (
                  <p className="text-center text-sm text-white/50 py-4">
                    No reviews yet. Be the first.
                  </p>
                ) : (
                  <>
                    {reviewLocked && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <p className="text-sm text-white/70">Submit your review to unlock</p>
                      </div>
                    )}
                    <div className={cn('space-y-3', reviewLocked && 'opacity-30 blur-[1px]')}>
                      {reviewStats.sortedReviews.map((review: ScreeningReview) => {
                        const contextActions = getReviewContextActions(review);
                        const reviewContent = (
                          <div className="border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 border border-white/10">
                                <AvatarImage
                                  src={review.profiles?.avatar_url || ''}
                                  alt={review.profiles?.display_name || 'Reviewer'}
                                />
                                <AvatarFallback className="bg-black/40 text-[10px] text-white/70">
                                  {review.profiles?.display_name
                                    ? review.profiles.display_name.slice(0, 1).toUpperCase()
                                    : <User className="h-3 w-3 text-white/50" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-white truncate">
                                  {review.profiles?.display_name || 'Anonymous'}
                                </p>
                                <p className="text-[10px] text-white/50">
                                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>

                            {/* Metric Scores Display */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {review.track_selection_score !== null && review.track_selection_score !== undefined && (
                                <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-1">
                                  {review.track_selection_score === 0 && <ChevronsDown className="h-3 w-3 text-red-400" />}
                                  {review.track_selection_score === 1 && <ChevronDown className="h-3 w-3 text-orange-400" />}
                                  {review.track_selection_score === 2 && <Minus className="h-3 w-3 text-white/50" />}
                                  {review.track_selection_score === 3 && <ChevronUp className="h-3 w-3 text-green-400" />}
                                  {review.track_selection_score === 4 && <ChevronsUp className="h-3 w-3 text-emerald-400" />}
                                  <span className="text-[10px] text-white/60 uppercase tracking-wide">Track</span>
                                </div>
                              )}
                              {review.flow_energy_score !== null && review.flow_energy_score !== undefined && (
                                <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-1">
                                  {review.flow_energy_score === 0 && <ChevronsDown className="h-3 w-3 text-red-400" />}
                                  {review.flow_energy_score === 1 && <ChevronDown className="h-3 w-3 text-orange-400" />}
                                  {review.flow_energy_score === 2 && <Minus className="h-3 w-3 text-white/50" />}
                                  {review.flow_energy_score === 3 && <ChevronUp className="h-3 w-3 text-green-400" />}
                                  {review.flow_energy_score === 4 && <ChevronsUp className="h-3 w-3 text-emerald-400" />}
                                  <span className="text-[10px] text-white/60 uppercase tracking-wide">Flow</span>
                                </div>
                              )}
                              {review.technical_execution_score !== null && review.technical_execution_score !== undefined && (
                                <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-1">
                                  {review.technical_execution_score === 0 && <ChevronsDown className="h-3 w-3 text-red-400" />}
                                  {review.technical_execution_score === 1 && <ChevronDown className="h-3 w-3 text-orange-400" />}
                                  {review.technical_execution_score === 2 && <Minus className="h-3 w-3 text-white/50" />}
                                  {review.technical_execution_score === 3 && <ChevronUp className="h-3 w-3 text-green-400" />}
                                  {review.technical_execution_score === 4 && <ChevronsUp className="h-3 w-3 text-emerald-400" />}
                                  <span className="text-[10px] text-white/60 uppercase tracking-wide">Technical</span>
                                </div>
                              )}
                            </div>

                            {review.internal_notes && (
                              <p className="mt-3 text-xs text-white/70">{review.internal_notes}</p>
                            )}
                          </div>
                        );

                        return contextActions.length > 0 ? (
                          <FmCommonContextMenu key={review.id} actions={contextActions} data={review}>
                            {reviewContent}
                          </FmCommonContextMenu>
                        ) : (
                          <div key={review.id}>{reviewContent}</div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
        </div>
      </div>

      {pendingRequest && timerState && (
        <TimerSwitchConfirm
          currentTitle={timerState.submissionTitle}
          newTitle={pendingRequest.submissionTitle}
          onConfirm={confirmPendingTimer}
          onCancel={cancelPendingRequest}
        />
      )}
    </Layout>
  );
}




