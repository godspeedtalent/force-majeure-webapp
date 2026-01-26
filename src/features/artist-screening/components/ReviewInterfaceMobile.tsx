/**
 * Review Interface - Mobile Version
 *
 * Optimized mobile layout for reviewing artist submissions.
 * Features a streamlined UI with collapsible sections and fixed action bar.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Star,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Music,
  ArrowLeft,
  MoreHorizontal,
  EyeOff,
  Trash,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  ChevronsDown,
  Minus,
  ChevronsUp,
  Pencil,
} from 'lucide-react';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
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
  useMakeDecision,
  useReviewTimer,
} from '../hooks';
import { ignoreSubmission, deleteSubmission } from '../services/submissionService';
import { REVIEW_METRIC_CONFIGS } from '../config/reviewMetrics';
import { calculateTotalScore, createDefaultMetricScores } from '../utils/reviewScoring';
import { TimerSwitchConfirm } from './ReviewTimer';
import { QualitativeMetricSelector } from './QualitativeMetricSelector';
import type {
  CreateReviewInput,
  MakeDecisionInput,
  ReviewMetricId,
  ReviewMetricScores,
  ScreeningReview,
  SubmissionStatus,
} from '../types';
import {
  FmCommonContextMenu,
  type ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';

const STATUS_THEMES: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-200 border-red-500/30',
};

interface ReviewInterfaceMobileProps {
  submissionId: string;
}

export function ReviewInterfaceMobile({ submissionId }: ReviewInterfaceMobileProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const auth = useAuthSafe();
  const currentUserId = auth?.user?.id ?? null;
  const { isAdmin, hasRole } = useUserPermissions();
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  const canDelete = isAdmin() || isDeveloper;
  const { openTab } = useFmToolbarSafe();

  const { data: submission, isLoading, error } = useSubmission(submissionId);

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
  const makeDecision = useMakeDecision();

  // UI state
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showDecisionPanel, setShowDecisionPanel] = useState(false);

  // Form state
  const [metricScores, setMetricScores] = useState<ReviewMetricScores>(() =>
    createDefaultMetricScores()
  );
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [decisionNote, setDecisionNote] = useState<string>('');

  const totalMetricScore = useMemo(
    () => calculateTotalScore(metricScores),
    [metricScores]
  );

  const coverArt =
    submission?.artist_recordings?.cover_art || submission?.artists?.image_url || null;

  const heroStyles: CSSProperties | undefined = coverArt
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.95)), url(${coverArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const hasReviewed = currentUserId
    ? submission?.screening_reviews?.some(review => review.reviewer_id === currentUserId)
    : false;

  const reviewCount = submission?.submission_scores?.review_count ?? 0;
  const canMakeDecision = reviewCount >= 2;
  const canReview = submissionId ? isTimerCompleted(submissionId) : false;

  const reviewStats = useMemo(() => {
    if (!submission) {
      return { sortedReviews: [] as ScreeningReview[] };
    }
    const sortedReviews = [...submission.screening_reviews].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return { sortedReviews };
  }, [submission]);

  const artistGenres =
    submission?.artists?.artist_genres?.map(entry => entry.genre?.name).filter(Boolean) ?? [];

  useEffect(() => {
    setMetricScores(createDefaultMetricScores());
    setInternalNotes('');
    setDecisionNote('');
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
        title: t('screeningToolbar.reviewFailed', 'Failed to submit review'),
        context: 'ReviewInterfaceMobile.handleSubmitReview',
      });
    }
  };

  const handleMakeDecision = async (decision: 'approved' | 'rejected') => {
    if (!submission || !canMakeDecision) return;

    try {
      const input: MakeDecisionInput = {
        submission_id: submission.id,
        decision,
        decision_note: decisionNote || undefined,
      };

      await makeDecision.mutateAsync(input);

      toast.success(decision === 'approved' ? 'Submission approved' : 'Submission rejected');
      navigate('/staff?tab=dash_overview');
    } catch (err) {
      handleError(err, {
        title: 'Failed to make decision',
        context: 'ReviewInterfaceMobile.handleMakeDecision',
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

  const timerMinutesRemaining = Math.max(0, Math.floor(remainingSeconds / 60));
  const timerSecondsRemaining = Math.max(0, remainingSeconds % 60);
  const reviewLocked = !hasReviewed && reviewCount > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-black">
        <TopographicBackground opacity={0.35} />
        <div className="flex flex-1 items-center justify-center">
          <FmCommonLoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <div className="fixed inset-0 flex flex-col bg-black">
        <TopographicBackground opacity={0.35} />
        <div className="flex flex-1 flex-col items-center justify-center p-[20px]">
          <p className="mb-[20px] text-muted-foreground">Submission not found</p>
          <FmCommonButton variant="default" onClick={() => navigate(-1)}>
            Go Back
          </FmCommonButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-black">
        <TopographicBackground opacity={0.2} />

        {/* Header */}
        <div className="relative z-10 flex h-[56px] flex-shrink-0 items-center justify-between border-b border-white/10 px-[16px]">
          <button
            onClick={() => navigate('/staff?tab=dash_overview')}
            className="flex items-center gap-[8px] text-sm text-white/70 transition-colors hover:text-fm-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <Badge
            className={cn(
              'border px-2 py-0.5 text-[10px] font-semibold uppercase',
              STATUS_THEMES[submission.status]
            )}
          >
            {submission.status}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <FmCommonIconButton
                variant="default"
                size="sm"
                icon={MoreHorizontal}
                tooltip="More"
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
                Ignore
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="cursor-pointer text-fm-danger hover:bg-fm-danger/20"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto pb-[160px]">
          {/* Hero Section */}
          <div
            className="relative p-[20px]"
            style={heroStyles}
          >
            <div className="flex items-start gap-[16px]">
              {/* Cover Art */}
              <div className="relative h-[80px] w-[80px] flex-shrink-0 overflow-hidden border border-white/20 bg-black/40">
                {coverArt ? (
                  <img
                    src={coverArt}
                    alt={submission.artist_recordings.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music className="h-6 w-6 text-white/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-[8px]">
                <p className="text-xs uppercase tracking-widest text-white/50">Recording</p>
                <h1 className="truncate text-xl font-semibold text-white">
                  {submission.artist_recordings.name}
                </h1>
                <button
                  onClick={() => navigate(`/artists/${submission.artist_id}`)}
                  className="flex items-center gap-[8px] hover:opacity-80 transition-opacity"
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
                  <span className="truncate text-sm text-fm-gold hover:underline">{submission.artists.name}</span>
                </button>
                {artistGenres.length > 0 && (
                  <div className="flex flex-wrap gap-[6px]">
                    {artistGenres.slice(0, 2).map(genre => (
                      <span
                        key={genre}
                        className="border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] uppercase text-white/60"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-[16px] grid grid-cols-2 gap-[12px]">
              <div className="border border-white/10 bg-black/50 p-[12px]">
                <p className="text-[10px] uppercase tracking-widest text-white/50">Reviews</p>
                <p className="text-lg font-semibold text-white">{reviewCount}/2</p>
              </div>
              <div className="border border-white/10 bg-black/50 p-[12px]">
                <p className="text-[10px] uppercase tracking-widest text-white/50">Score</p>
                <p className="text-lg font-semibold text-fm-gold">
                  {submission.submission_scores?.indexed_score !== null &&
                  submission.submission_scores?.indexed_score !== undefined
                    ? Math.round(submission.submission_scores.indexed_score)
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Open Recording Link */}
          <a
            href={submission.artist_recordings.url}
            target="_blank"
            rel="noreferrer"
            className="mx-[20px] mt-[16px] flex items-center justify-center gap-[8px] border border-fm-gold/30 bg-fm-gold/10 p-[12px] text-sm font-medium text-fm-gold transition-colors hover:bg-fm-gold/20"
          >
            <ExternalLink className="h-4 w-4" />
            Open Recording
          </a>

          {submission.has_genre_mismatch && (
            <div className="mx-[20px] mt-[12px] flex items-center gap-[8px] border border-fm-danger/30 bg-fm-danger/10 p-[12px]">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-fm-danger" />
              <p className="text-xs text-fm-danger">Genre mismatch detected</p>
            </div>
          )}

          {/* Collapsible: Review History */}
          <div className="mx-[20px] mt-[16px] border border-white/10">
            <button
              onClick={() => setShowReviewHistory(!showReviewHistory)}
              className="flex w-full items-center justify-between p-[12px] text-left"
            >
              <span className="text-sm font-medium text-white">
                Review History ({reviewCount})
              </span>
              {showReviewHistory ? (
                <ChevronUp className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/50" />
              )}
            </button>
            {showReviewHistory && (
              <div className="border-t border-white/10 p-[12px]">
                {reviewCount === 0 ? (
                  <p className="text-center text-xs text-white/50">No reviews yet</p>
                ) : reviewLocked ? (
                  <p className="text-center text-xs text-white/60">
                    Submit your review to see peer notes
                  </p>
                ) : (
                  <div className="space-y-[12px]">
                    {reviewStats.sortedReviews.map((review: ScreeningReview) => {
                      const contextActions = getReviewContextActions(review);
                      const reviewContent = (
                        <div className="border border-white/5 bg-white/5 p-[10px]">
                          <div className="flex items-center gap-[8px]">
                            <Avatar className="h-6 w-6 border border-white/10">
                              <AvatarImage
                                src={review.profiles?.avatar_url || ''}
                                alt={review.profiles?.display_name || 'Reviewer'}
                              />
                              <AvatarFallback className="bg-black/40 text-[9px] text-white/70">
                                {review.profiles?.display_name
                                  ? review.profiles.display_name.slice(0, 1).toUpperCase()
                                  : <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-white">
                                {review.profiles?.display_name || 'Anonymous'}
                              </p>
                              <p className="text-[10px] text-white/50">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {/* Metric Scores Display */}
                          <div className="mt-[8px] flex flex-wrap gap-[6px]">
                            {review.track_selection_score != null && (
                              <div className="flex items-center gap-1 border border-white/10 bg-white/5 px-1.5 py-0.5">
                                {review.track_selection_score === 0 && <ChevronsDown className="h-3 w-3 text-red-400" />}
                                {review.track_selection_score === 1 && <ChevronDown className="h-3 w-3 text-orange-400" />}
                                {review.track_selection_score === 2 && <Minus className="h-3 w-3 text-white/50" />}
                                {review.track_selection_score === 3 && <ChevronUp className="h-3 w-3 text-green-400" />}
                                {review.track_selection_score === 4 && <ChevronsUp className="h-3 w-3 text-emerald-400" />}
                                <span className="text-[9px] text-white/60 uppercase tracking-wide">Track</span>
                              </div>
                            )}
                            {review.flow_energy_score != null && (
                              <div className="flex items-center gap-1 border border-white/10 bg-white/5 px-1.5 py-0.5">
                                {review.flow_energy_score === 0 && <ChevronsDown className="h-3 w-3 text-red-400" />}
                                {review.flow_energy_score === 1 && <ChevronDown className="h-3 w-3 text-orange-400" />}
                                {review.flow_energy_score === 2 && <Minus className="h-3 w-3 text-white/50" />}
                                {review.flow_energy_score === 3 && <ChevronUp className="h-3 w-3 text-green-400" />}
                                {review.flow_energy_score === 4 && <ChevronsUp className="h-3 w-3 text-emerald-400" />}
                                <span className="text-[9px] text-white/60 uppercase tracking-wide">Flow</span>
                              </div>
                            )}
                            {review.technical_execution_score != null && (
                              <div className="flex items-center gap-1 border border-white/10 bg-white/5 px-1.5 py-0.5">
                                {review.technical_execution_score === 0 && <ChevronsDown className="h-3 w-3 text-red-400" />}
                                {review.technical_execution_score === 1 && <ChevronDown className="h-3 w-3 text-orange-400" />}
                                {review.technical_execution_score === 2 && <Minus className="h-3 w-3 text-white/50" />}
                                {review.technical_execution_score === 3 && <ChevronUp className="h-3 w-3 text-green-400" />}
                                {review.technical_execution_score === 4 && <ChevronsUp className="h-3 w-3 text-emerald-400" />}
                                <span className="text-[9px] text-white/60 uppercase tracking-wide">Technical</span>
                              </div>
                            )}
                          </div>

                          {review.internal_notes && (
                            <p className="mt-[8px] text-xs text-white/70">{review.internal_notes}</p>
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
                )}
              </div>
            )}
          </div>

          {/* Collapsible: Context Info */}
          <div className="mx-[20px] mt-[12px] border border-white/10">
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex w-full items-center justify-between p-[12px] text-left"
            >
              <span className="text-sm font-medium text-white">Context & Details</span>
              {showContext ? (
                <ChevronUp className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/50" />
              )}
            </button>
            {showContext && (
              <div className="space-y-[8px] border-t border-white/10 p-[12px]">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Submitted</span>
                  <span className="text-white">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Context</span>
                  <span className="text-white capitalize">{submission.context_type}</span>
                </div>
                {submission.context_type === 'event' && submission.events && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Event</span>
                    <span className="truncate text-white">{submission.events.title}</span>
                  </div>
                )}
                {submission.context_type === 'venue' && submission.venues && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Venue</span>
                    <span className="truncate text-white">{submission.venues.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Review Form (when timer completed and not already reviewed) */}
          {canReview && !hasReviewed && (
            <div className="mx-[20px] mt-[16px] space-y-[12px] border border-fm-gold/20 bg-fm-gold/5 p-[16px]">
              <p className="text-xs uppercase tracking-widest text-fm-gold">Your Review</p>

              <div className="space-y-[12px]">
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
                label="Notes"
                description="Only reviewers can see"
                value={internalNotes}
                onChange={event => setInternalNotes(event.target.value)}
                placeholder="What stood out..."
                multiline
                rows={2}
              />

              <div className="flex items-center justify-between border border-white/10 bg-black/30 p-[10px]">
                <span className="text-xs uppercase text-white/50">Score</span>
                <span className="text-lg font-bold text-fm-gold">{totalMetricScore}/12</span>
              </div>
            </div>
          )}

          {/* Already Reviewed Message */}
          {hasReviewed && (
            <div className="mx-[20px] mt-[16px] border border-emerald-400/30 bg-emerald-500/10 p-[12px]">
              <p className="text-center text-xs text-emerald-200">
                You have already reviewed this submission
              </p>
            </div>
          )}

          {/* Decision Panel (collapsible, only when eligible) */}
          {canMakeDecision && (
            <div className="mx-[20px] mt-[12px] border border-white/10">
              <button
                onClick={() => setShowDecisionPanel(!showDecisionPanel)}
                className="flex w-full items-center justify-between p-[12px] text-left"
              >
                <span className="text-sm font-medium text-fm-gold">Make Decision</span>
                {showDecisionPanel ? (
                  <ChevronUp className="h-4 w-4 text-fm-gold/50" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-fm-gold/50" />
                )}
              </button>
              {showDecisionPanel && (
                <div className="space-y-[12px] border-t border-white/10 p-[12px]">
                  <FmCommonTextField
                    label="Decision Note"
                    description="Visible to artist"
                    value={decisionNote}
                    onChange={event => setDecisionNote(event.target.value)}
                    placeholder="Optional note..."
                    multiline
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-[10px]">
                    <FmCommonButton
                      variant="default"
                      size="sm"
                      onClick={() => handleMakeDecision('approved')}
                      disabled={makeDecision.isPending}
                      className="border-emerald-400/40 hover:bg-emerald-500/20"
                    >
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                      Approve
                    </FmCommonButton>
                    <FmCommonButton
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => handleMakeDecision('rejected')}
                      disabled={makeDecision.isPending}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Reject
                    </FmCommonButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/95 p-[16px] backdrop-blur-lg">
          {/* Timer Status */}
          {isTimerActive && timerState && (
            <div className="mb-[12px] flex items-center justify-between text-xs">
              <div className="flex items-center gap-[6px] text-white/70">
                <Clock3 className="h-3.5 w-3.5 text-fm-gold" />
                <span>Timer: {timerMinutesRemaining}:{timerSecondsRemaining.toString().padStart(2, '0')}</span>
              </div>
              <div className="flex gap-[12px]">
                <button
                  onClick={relaunchRecording}
                  className="text-fm-gold hover:text-fm-gold/80"
                >
                  Reopen
                </button>
                <button
                  onClick={cancelTimer}
                  className="text-white/50 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Primary Action */}
          {!canReview && !hasReviewed ? (
            <FmCommonButton
              variant="gold"
              size="lg"
              onClick={handleStartReview}
              disabled={isTimerActive}
              className="w-full"
            >
              <Play className="mr-2 h-5 w-5" />
              {isTimerActive ? 'Timer Running...' : 'Start Review Timer'}
            </FmCommonButton>
          ) : canReview && !hasReviewed ? (
            <FmCommonButton
              variant="gold"
              size="lg"
              onClick={handleSubmitReview}
              disabled={createReview.isPending}
              className="w-full"
            >
              <Star className="mr-2 h-5 w-5" />
              {createReview.isPending ? 'Submitting...' : 'Submit Review'}
            </FmCommonButton>
          ) : (
            <FmCommonButton
              variant="default"
              size="lg"
              onClick={() => navigate('/staff?tab=dash_overview')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Queue
            </FmCommonButton>
          )}
        </div>
      </div>

      {/* Timer Switch Confirmation Modal */}
      {pendingRequest && timerState && (
        <TimerSwitchConfirm
          currentTitle={timerState.submissionTitle}
          newTitle={pendingRequest.submissionTitle}
          onConfirm={confirmPendingTimer}
          onCancel={cancelPendingRequest}
        />
      )}
    </>
  );
}
