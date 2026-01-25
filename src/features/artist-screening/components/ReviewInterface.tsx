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
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Music,
  ArrowLeft,
  MoreHorizontal,
  EyeOff,
  Trash,
  Layers,
  Clock3,
  Tags,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
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
import { toast } from 'sonner';
import {
  useSubmission,
  useCreateReview,
  useMakeDecision,
  useReviewTimer,
} from '../hooks';
import { ignoreSubmission, deleteSubmission } from '../services/submissionService';
import { REVIEW_METRIC_CONFIGS } from '../config/reviewMetrics';
import { calculateTotalScore, createDefaultMetricScores } from '../utils/reviewScoring';
import { ReviewTimer, TimerSwitchConfirm } from './ReviewTimer';
import { QualitativeMetricSelector } from './QualitativeMetricSelector';
import type {
  CreateReviewInput,
  MakeDecisionInput,
  ReviewMetricId,
  ReviewMetricScores,
  ScreeningReview,
  SubmissionStatus,
} from '../types';
import { FmTagMultiSelect } from '@/features/tagging/components/FmTagMultiSelect';
import { applyTagToSubmission, removeTagFromSubmission } from '@/features/tagging/services/tagService';
import type { Tag } from '@/features/tagging/types';

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
  const auth = useAuthSafe();
  const currentUserId = auth?.user?.id ?? null;
  const { isAdmin, hasRole } = useUserPermissions();
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  const canDelete = isAdmin() || isDeveloper;

  const { data: submission, isLoading, error } = useSubmission(id!);

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
    overrideTimer,
  } = useReviewTimer();

  const createReview = useCreateReview();
  const makeDecision = useMakeDecision();

  const [metricScores, setMetricScores] = useState<ReviewMetricScores>(() =>
    createDefaultMetricScores()
  );
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [decisionNote, setDecisionNote] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const totalMetricScore = useMemo(
    () => calculateTotalScore(metricScores),
    [metricScores]
  );

  const coverArt =
    submission?.artist_recordings.cover_art || submission?.artists.image_url || null;

  const heroStyles: CSSProperties | undefined = coverArt
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(6,6,10,0.95), rgba(6,6,10,0.65)), url(${coverArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const hasReviewed = currentUserId
    ? submission?.screening_reviews.some(review => review.reviewer_id === currentUserId)
    : false;

  const reviewCount = submission?.submission_scores?.review_count ?? 0;
  const canMakeDecision = reviewCount >= 2;
  const canReview = id ? isTimerCompleted(id) : false;

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
    submission?.artists.artist_genres?.map(entry => entry.genre.name) ?? [];

  const submissionTags = submission?.submission_tags ?? [];

  useEffect(() => {
    setMetricScores(createDefaultMetricScores());
    setInternalNotes('');
    setDecisionNote('');
    setSelectedTags(submissionTags.map(entry => entry.tag));
  }, [submission?.id]);

  const handleStartReview = () => {
    if (!submission) return;
    const submissionTitle = `${submission.artists.name} - ${submission.artist_recordings.name}`;
    requestTimer(submission.id, submissionTitle, submission.artist_recordings.url);
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
      setMetricScores(createDefaultMetricScores());
      setInternalNotes('');

      toast.success('Review submitted successfully');
    } catch (err) {
      handleError(err, {
        title: 'Failed to submit review',
        context: 'ReviewInterface.handleSubmitReview',
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
        context: 'ReviewInterface.handleMakeDecision',
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
        <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
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

          <FmCommonCard
            variant="frosted"
            className="overflow-hidden rounded-[32px] border-white/15 p-0"
          >
            <div
              className={cn(
                'relative isolate p-6 sm:p-10',
                'bg-gradient-to-br from-[#0f0f13] via-[#060608] to-[#050505]'
              )}
              style={heroStyles}
            >
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                <div className="flex items-center gap-5">
                  <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                    {coverArt ? (
                      <img
                        src={coverArt}
                        alt={submission.artist_recordings.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/40">
                        <Music className="h-8 w-8" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/15" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-widest text-white/50">
                      Recording
                    </div>
                    <div className="text-3xl font-semibold text-white">
                      {submission.artist_recordings.name}
                    </div>
                    <div className="flex items-center gap-3 text-white/70">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage
                          src={submission.artists.image_url || ''}
                          alt={submission.artists.name}
                        />
                        <AvatarFallback className="bg-white/10 text-xs font-semibold text-white/70">
                          {submission.artists.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-base font-medium">{submission.artists.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {artistGenres.slice(0, 3).map(genre => (
                        <span
                          key={genre}
                          className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-white/70"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-4">
                  <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 min-w-[220px]">
                    <Layers className="h-8 w-8 text-fm-gold" />
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50">
                        Reviews Logged
                      </p>
                      <p className="text-xl font-semibold text-white">{reviewCount}</p>
                      <p className="text-xs text-white/60">2 needed to decide</p>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 min-w-[220px]">
                    <Clock3 className="h-8 w-8 text-fm-gold" />
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50">
                        Decision Status
                      </p>
                      <p className="text-xl font-semibold text-white">
                        {canMakeDecision ? 'Eligible' : 'Waiting'}
                      </p>
                      <p className="text-xs text-white/60">
                        {canMakeDecision ? 'You can decide now' : 'More reviews needed'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">Submitted</p>
                  <p className="text-base text-white">{submissionDateLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Most Recent Review
                  </p>
                  <p className="text-base text-white">{mostRecentReviewDisplay}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">Context</p>
                  <p className="text-base text-white">{contextDescriptor?.value ?? 'N/A'}</p>
                  {contextDescriptor?.extra && (
                    <p className="text-xs text-white/60">{contextDescriptor.extra}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">Queue</p>
                  <p className="text-base text-white">
                    {submission.context_type === 'general'
                      ? 'Discovery backlog'
                      : submission.context_type === 'event'
                      ? 'Event-specific'
                      : 'Venue request'}
                  </p>
                </div>
              </div>
            </div>
          </FmCommonCard>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <FmCommonCard
                variant="frosted"
                className="overflow-hidden border-white/10 p-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-6 py-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Peer Feedback
                    </p>
                    <h3 className="text-2xl font-semibold text-white">Review History</h3>
                  </div>
                  {reviewLocked && (
                    <Badge className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wide text-white/70">
                      Locked until you submit
                    </Badge>
                  )}
                </div>
                <div className="relative space-y-6 px-6 py-6">
                  {reviewCount === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/60">
                      No reviews yet. Start the process to set the tone.
                    </div>
                  ) : (
                    <>
                      {reviewLocked && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/70 text-center text-sm text-white/70 backdrop-blur-sm">
                          Submit your review to reveal peer notes and ratings.
                        </div>
                      )}
                      <div
                        className={cn(
                          'space-y-4',
                          reviewLocked && 'pointer-events-none opacity-50 blur-[1px]'
                        )}
                      >
                        {reviewStats.sortedReviews.map((review: ScreeningReview) => (
                          <div
                            key={review.id}
                            className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="h-10 w-10 border border-white/10">
                                  <AvatarImage
                                    src={review.profiles?.avatar_url || ''}
                                    alt={review.profiles?.display_name || 'Reviewer'}
                                  />
                                  <AvatarFallback className="bg-black/40 text-xs font-semibold text-white/70">
                                    {review.profiles?.display_name
                                      ? review.profiles.display_name.slice(0, 1).toUpperCase()
                                      : <User className="h-4 w-4 text-white/50" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">
                                    {review.profiles?.display_name || 'Anonymous reviewer'}
                                  </p>
                                  <p className="text-xs text-white/60">
                                    {formatDistanceToNow(new Date(review.created_at), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {review.internal_notes && (
                              <p className="mt-3 text-sm text-white/80">{review.internal_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </FmCommonCard>

              <FmCommonCard
                variant="frosted"
                className="overflow-hidden border-white/10 p-0"
              >
                <div className="border-b border-white/5 px-6 py-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Submission Snapshot
                  </p>
                  <h3 className="text-2xl font-semibold text-white">Context & Signals</h3>
                </div>
                <div className="space-y-6 px-6 py-6">
                  <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 sm:flex-row sm:items-center">
                    {submission.artists.image_url ? (
                      <img
                        src={submission.artists.image_url}
                        alt={submission.artists.name}
                        className="h-16 w-16 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/40">
                        <User className="h-6 w-6 text-white/50" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-widest text-white/50">Artist</p>
                      <p className="text-xl font-semibold text-white">{submission.artists.name}</p>
                      <p className="text-xs text-white/50">
                        {artistGenres.length > 0 ? artistGenres.join(' / ') : 'No genres listed'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-white/50">Recording</p>
                        <p className="text-lg text-white">{submission.artist_recordings.name}</p>
                        <p className="text-xs text-white/50">{platformLabel}</p>
                      </div>
                      <a
                        href={submission.artist_recordings.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-semibold text-fm-gold hover:text-fm-gold/80"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Open Recording
                      </a>
                    </div>
                  </div>

                  {submission.has_genre_mismatch && (
                    <div className="rounded-2xl border border-fm-danger/30 bg-fm-danger/10 p-5">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-fm-danger" />
                        <div>
                          <p className="text-sm font-medium text-fm-danger">Genre mismatch</p>
                          <p className="text-xs text-white/70">
                            Artist genres do not align with venue requirements.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                        <Calendar className="h-4 w-4" />
                        Submitted
                      </div>
                      <p className="text-sm text-white">{submissionDateLabel}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                        <Clock3 className="h-4 w-4" />
                        Minimum Reviews
                      </div>
                      <p className="text-sm text-white">
                        Requires {submission.submission_scores?.review_count ?? 0}/2 reviews
                      </p>
                      <p className="text-xs text-white/60">Needed for final decision</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                      <Tags className="h-4 w-4" />
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
              </FmCommonCard>
            </div>
            <div className="h-fit space-y-6 lg:sticky lg:top-8">
              <FmCommonCard
                variant="frosted"
                className="overflow-hidden border-white/10 p-0 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              >
                <div className="border-b border-white/5 px-6 py-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Your Session
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-2xl font-semibold text-white">Review Controls</h3>
                    {isTimerActive && (
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                        Timer {timerMinutesRemaining}:{timerSecondsRemaining.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-5 px-6 py-6">
                  {!canReview && !hasReviewed && (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-black/30 p-5 text-sm text-white/70">
                      <p className="mb-4 text-base text-white">
                        Start the review timer to unlock scoring controls.
                      </p>
                      <FmCommonButton
                        variant="gold"
                        size="lg"
                        onClick={handleStartReview}
                        disabled={isTimerActive}
                        className="w-full"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        {isTimerActive ? 'Timer Active' : 'Start Review Timer'}
                      </FmCommonButton>
                      {isTimerActive && timerState && (
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
                          <button
                            type="button"
                            onClick={relaunchRecording}
                            className="text-fm-gold hover:text-fm-gold/80"
                          >
                            Relaunch recording
                          </button>
                          <button
                            type="button"
                            onClick={cancelTimer}
                            className="text-white/60 hover:text-white"
                          >
                            Cancel timer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {hasReviewed && (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                      <p>You have already logged a review for this submission.</p>
                    </div>
                  )}

                  {canReview && !hasReviewed && (
                    <>
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
                        description="Only other reviewers can see these notes."
                        value={internalNotes}
                        onChange={event => setInternalNotes(event.target.value)}
                        placeholder="Share what stood out, deal-breakers, or context to remember..."
                        multiline
                        rows={4}
                      />

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
                    </>
                  )}
                </div>
              </FmCommonCard>

              {canMakeDecision && (
                <FmCommonCard variant="frosted" className="border-white/10">
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Final Call
                      </p>
                      <h3 className="text-2xl font-semibold text-white">Decision Panel</h3>
                    </div>

                    <div className="rounded-2xl border border-fm-gold/30 bg-black/30 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Indexed Score
                      </p>
                      <p className="text-4xl font-semibold text-fm-gold">
                        {submission.submission_scores?.indexed_score !== null &&
                        submission.submission_scores?.indexed_score !== undefined
                          ? Math.round(submission.submission_scores.indexed_score)
                          : '-'}
                      </p>
                      <p className="text-xs text-white/60">
                        Based on {reviewCount} reviews
                      </p>
                    </div>

                    <FmCommonTextField
                      label="Decision Note (Optional)"
                      description="Visible to the artist after approval or rejection."
                      value={decisionNote}
                      onChange={event => setDecisionNote(event.target.value)}
                      placeholder="Give the artist a personal note..."
                      multiline
                      rows={3}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FmCommonButton
                        variant="default"
                        onClick={() => handleMakeDecision('approved')}
                        disabled={makeDecision.isPending}
                        className="border border-emerald-400/40 hover:bg-emerald-500/20"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </FmCommonButton>
                      <FmCommonButton
                        variant="destructive-outline"
                        onClick={() => handleMakeDecision('rejected')}
                        disabled={makeDecision.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </FmCommonButton>
                    </div>
                  </div>
                </FmCommonCard>
              )}
            </div>
          </div>
        </div>
      </div>

      {isTimerActive && timerState && (
        <ReviewTimer
          submissionId={timerState.submissionId}
          submissionTitle={timerState.submissionTitle}
          recordingUrl={timerState.recordingUrl}
          remainingSeconds={remainingSeconds}
          isAdmin={isAdmin()}
          onReturnToSubmission={() => {
            if (timerState.submissionId !== id) {
              navigate(`/staff/screening/review/${timerState.submissionId}`);
            }
          }}
          onRelaunchRecording={relaunchRecording}
          onCancel={cancelTimer}
          onOverrideTimer={overrideTimer}
        />
      )}

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




