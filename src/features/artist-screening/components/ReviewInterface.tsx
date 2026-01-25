/**
 * Review Interface
 *
 * Full-screen review page for staff to review and rate artist submissions.
 * Features:
 * - Start review button (opens recording, starts 20min timer)
 * - Floating timer modal
 * - Review form (rating, notes, decision note)
 * - Hidden reviews until you submit
 * - Decision buttons (approve/reject after 2+ reviews)
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Star,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Music,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonSlider } from '@/components/common/forms/FmCommonSlider';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Badge } from '@/components/common/shadcn/badge';
import { cn, formatTimeDisplay, handleError } from '@/shared';
import { toast } from 'sonner';
import {
  useSubmission,
  useCreateReview,
  useMakeDecision,
  useReviewTimer,
} from '../hooks';
import { ReviewTimer } from './ReviewTimer';
import type { CreateReviewInput, MakeDecisionInput } from '../types';

// ============================================================================
// Component
// ============================================================================

export function ReviewInterface() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch submission details
  const {
    data: submission,
    isLoading,
    error,
  } = useSubmission(id!);

  // Review timer hook
  const {
    timerState,
    remainingSeconds,
    isTimerActive,
    startTimer,
    cancelTimer,
    isTimerCompleted,
  } = useReviewTimer();

  // Mutations
  const createReview = useCreateReview();
  const makeDecision = useMakeDecision();

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [decisionNote, setDecisionNote] = useState<string>('');

  // Check if this submission's timer is completed
  const canReview = id ? isTimerCompleted(id) : false;

  // Check if user has already reviewed
  const hasReviewed = submission?.screening_reviews.some(
    review => review.reviewer_id === submission?.decided_by // TODO: Get actual user ID
  );

  // Calculate if decision can be made (2+ reviews)
  const reviewCount = submission?.submission_scores?.review_count ?? 0;
  const canMakeDecision = reviewCount >= 2;

  // Handle start review
  const handleStartReview = () => {
    if (!submission) return;

    const success = startTimer(
      submission.id,
      submission.artist_recordings.url
    );

    if (!success) {
      // Timer already active or other error
      return;
    }
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!submission || !canReview) return;

    try {
      const input: CreateReviewInput = {
        submission_id: submission.id,
        rating,
        internal_notes: internalNotes || undefined,
        listen_duration_seconds: 1200, // Full 20 minutes
      };

      await createReview.mutateAsync(input);

      // Clear form
      setRating(5);
      setInternalNotes('');

      toast.success('Review submitted successfully');
    } catch (error) {
      handleError(error, {
        title: 'Failed to submit review',
        context: 'ReviewInterface.handleSubmitReview',
      });
    }
  };

  // Handle decision (approve/reject)
  const handleMakeDecision = async (decision: 'approved' | 'rejected') => {
    if (!submission || !canMakeDecision) return;

    try {
      const input: MakeDecisionInput = {
        submission_id: submission.id,
        decision,
        decision_note: decisionNote || undefined,
      };

      await makeDecision.mutateAsync(input);

      toast.success(
        decision === 'approved' ? 'Submission approved' : 'Submission rejected'
      );

      // Navigate back to dashboard
      navigate('/staff?tab=dash_overview');
    } catch (error) {
      handleError(error, {
        title: 'Failed to make decision',
        context: 'ReviewInterface.handleMakeDecision',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <FmCommonLoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-[20px]">
            Submission not found
          </p>
          <FmCommonButton variant="default" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-[10px] md:px-[20px] py-[20px] md:py-[40px] max-w-6xl">
        {/* Header - Mobile stacks vertically */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[10px] mb-[20px] md:mb-[40px]">
          <FmCommonButton
            variant="default"
            onClick={() => navigate(-1)}
            size="sm"
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Queue</span>
            <span className="sm:hidden">Back</span>
          </FmCommonButton>

          <Badge
            className={cn(
              'rounded-none text-xs font-medium border w-fit',
              submission.status === 'approved'
                ? 'bg-fm-success/20 text-fm-success border-fm-success/40'
                : submission.status === 'rejected'
                ? 'bg-fm-danger/20 text-fm-danger border-fm-danger/40'
                : 'bg-fm-gold/20 text-fm-gold border-fm-gold/40'
            )}
          >
            {submission.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] md:gap-[40px]">
          {/* Left Column: Submission Details */}
          <div className="space-y-[15px] md:space-y-[20px]">
            {/* Artist & Recording Card */}
            <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
              <h2 className="text-xl md:text-2xl font-canela text-white mb-[15px] md:mb-[20px]">
                Submission Details
              </h2>

              {/* Artist */}
              <div className="flex items-center gap-[10px] md:gap-[15px] mb-[15px] md:mb-[20px]">
                {submission.artists.image_url ? (
                  <img
                    src={submission.artists.image_url}
                    alt={submission.artists.name}
                    className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-none flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-white/10 flex items-center justify-center rounded-none flex-shrink-0">
                    <User className="h-6 w-6 md:h-8 md:w-8 text-white/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs md:text-sm text-muted-foreground uppercase mb-1">
                    Artist
                  </div>
                  <div className="text-lg md:text-xl font-medium text-white truncate">
                    {submission.artists.name}
                  </div>
                </div>
              </div>

              {/* Recording */}
              <div className="border-t border-white/20 pt-[15px] md:pt-[20px]">
                <div className="text-xs md:text-sm text-muted-foreground uppercase mb-[10px]">
                  Recording
                </div>
                <div className="flex items-center gap-[10px] mb-[10px]">
                  <Music className="h-4 w-4 md:h-5 md:w-5 text-fm-gold flex-shrink-0" />
                  <div className="text-base md:text-lg text-white truncate">
                    {submission.artist_recordings.name}
                  </div>
                </div>
                <div className="flex items-center gap-[10px] text-xs md:text-sm text-muted-foreground">
                  <span className="uppercase">
                    {submission.artist_recordings.platform}
                  </span>
                  {submission.artist_recordings.duration_seconds && (
                    <>
                      <span>•</span>
                      <span>
                        {formatTimeDisplay(
                          submission.artist_recordings.duration_seconds
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Mismatch Warning */}
              {submission.has_genre_mismatch && (
                <div className="mt-[15px] md:mt-[20px] p-[10px] md:p-[15px] bg-fm-danger/10 border border-fm-danger/40 rounded-none">
                  <div className="flex items-start gap-[10px]">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-fm-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs md:text-sm font-medium text-fm-danger">
                        Genre Mismatch
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        Artist's genres don't match venue requirements
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Context */}
              <div className="border-t border-white/20 pt-[15px] md:pt-[20px] mt-[15px] md:mt-[20px]">
                <div className="text-xs md:text-sm text-muted-foreground uppercase mb-[10px]">
                  Context
                </div>
                {submission.context_type === 'event' && submission.events ? (
                  <div>
                    <div className="text-sm md:text-base text-white/80">Event Undercard</div>
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {submission.events.title}
                    </div>
                  </div>
                ) : submission.context_type === 'venue' && submission.venues ? (
                  <div>
                    <div className="text-sm md:text-base text-white/80">Venue Booking</div>
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {submission.venues.name}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm md:text-base text-white/80">General Discovery</div>
                )}
              </div>

              {/* Submitted Date */}
              <div className="border-t border-white/20 pt-[15px] md:pt-[20px] mt-[15px] md:mt-[20px]">
                <div className="flex items-center gap-[10px] text-xs md:text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Submitted {new Date(submission.created_at).toLocaleDateString()}
                </div>
              </div>
            </FmCommonCard>

            {/* Start Review Button */}
            {!canReview && !hasReviewed && (
              <FmCommonButton
                variant="gold"
                size="lg"
                onClick={handleStartReview}
                disabled={isTimerActive}
                className="w-full"
              >
                <Play className="h-5 w-5 mr-2" />
                {isTimerActive ? 'Timer Active' : 'Start Review'}
              </FmCommonButton>
            )}

            {/* Existing Reviews (blurred until you review) */}
            <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
              <h3 className="text-base md:text-lg font-canela text-white mb-[15px] md:mb-[20px]">
                Reviews ({reviewCount})
              </h3>

              {reviewCount === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground text-center py-[15px] md:py-[20px]">
                  No reviews yet. Be the first!
                </p>
              ) : (
                <div
                  className={cn(
                    'space-y-[10px] md:space-y-[15px]',
                    !hasReviewed && 'blur-[2px] select-none pointer-events-none'
                  )}
                >
                  {submission.screening_reviews.map(review => (
                    <div
                      key={review.id}
                      className="p-[10px] md:p-[15px] bg-black/40 border border-white/10 rounded-none"
                    >
                      <div className="flex items-center justify-between mb-[10px]">
                        <div className="flex items-center gap-[10px] min-w-0">
                          {review.profiles?.avatar_url ? (
                            <img
                              src={review.profiles.avatar_url}
                              alt={review.profiles.display_name || 'Reviewer'}
                              className="h-7 w-7 md:h-8 md:w-8 object-cover rounded-none flex-shrink-0"
                            />
                          ) : (
                            <div className="h-7 w-7 md:h-8 md:w-8 bg-white/10 flex items-center justify-center rounded-none flex-shrink-0">
                              <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/40" />
                            </div>
                          )}
                          <div className="text-xs md:text-sm text-white truncate">
                            {review.profiles?.display_name || 'Anonymous'}
                          </div>
                        </div>
                        <div className="flex items-center gap-[5px] flex-shrink-0">
                          <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-fm-gold fill-fm-gold" />
                          <span className="text-base md:text-lg font-bold text-fm-gold">
                            {review.rating}
                          </span>
                        </div>
                      </div>
                      {review.internal_notes && (
                        <p className="text-xs md:text-sm text-white/80 mt-[10px]">
                          {review.internal_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!hasReviewed && reviewCount > 0 && (
                <div className="text-xs text-center text-muted-foreground mt-[10px]">
                  Submit your review to see others' ratings
                </div>
              )}
            </FmCommonCard>
          </div>

          {/* Right Column: Review Form & Decision */}
          <div className="space-y-[15px] md:space-y-[20px]">
            {/* Review Form */}
            <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
              <h3 className="text-base md:text-lg font-canela text-white mb-[15px] md:mb-[20px]">
                Your Review
              </h3>

              {!canReview && !hasReviewed ? (
                <div className="text-center py-[20px] md:py-[40px]">
                  <Play className="h-10 w-10 md:h-12 md:w-12 mx-auto text-fm-gold/40 mb-[10px] md:mb-[15px]" />
                  <p className="text-xs md:text-sm text-muted-foreground px-[10px]">
                    Start the timer and listen for 20 minutes before reviewing
                  </p>
                </div>
              ) : hasReviewed ? (
                <div className="text-center py-[20px] md:py-[40px]">
                  <CheckCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto text-green-400 mb-[10px] md:mb-[15px]" />
                  <p className="text-xs md:text-sm text-white">
                    You've already reviewed this submission
                  </p>
                </div>
              ) : (
                <div className="space-y-[15px] md:space-y-[20px]">
                  {/* Rating Slider */}
                  <div className="flex items-end gap-[10px] md:gap-[15px]">
                    <div className="flex-1">
                      <FmCommonSlider
                        label="Rating"
                        value={rating}
                        onValueChange={setRating}
                        min={1}
                        max={10}
                        step={1}
                        showValue={false}
                      />
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-fm-gold w-10 md:w-12 text-center pb-1">
                      {rating}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <FmCommonTextField
                    label="Internal Notes (Staff Only)"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Your thoughts on this submission..."
                    multiline
                    rows={3}
                  />

                  {/* Submit Review Button */}
                  <FmCommonButton
                    variant="gold"
                    size="lg"
                    onClick={handleSubmitReview}
                    disabled={createReview.isPending}
                    className="w-full"
                  >
                    <Star className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                  </FmCommonButton>
                </div>
              )}
            </FmCommonCard>

            {/* Decision Section */}
            {canMakeDecision && (
              <FmCommonCard variant="frosted" className="p-[15px] md:p-[20px]">
                <h3 className="text-base md:text-lg font-canela text-white mb-[15px] md:mb-[20px]">
                  Make Decision
                </h3>

                <div className="space-y-[15px] md:space-y-[20px]">
                  {/* Score Display */}
                  {submission.submission_scores && (
                    <div className="p-[10px] md:p-[15px] bg-black/40 border border-fm-gold/40 rounded-none">
                      <div className="text-center">
                        <div className="text-xs md:text-sm text-muted-foreground uppercase mb-[5px]">
                          Indexed Score
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-fm-gold">
                          {submission.submission_scores.indexed_score ?? 0}
                        </div>
                        <div className="text-xs text-white/60 mt-[5px]">
                          Based on {reviewCount} reviews
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Decision Note */}
                  <FmCommonTextField
                    label="Decision Note (Optional)"
                    description="This message will be shown to the artist"
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Optional message to the artist..."
                    multiline
                    rows={3}
                  />

                  {/* Decision Buttons */}
                  <div className="grid grid-cols-2 gap-[10px]">
                    <FmCommonButton
                      variant="default"
                      onClick={() => handleMakeDecision('approved')}
                      disabled={makeDecision.isPending}
                      className="border-green-500/40 hover:bg-green-500/20 hover:border-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Approve</span>
                      <span className="sm:hidden">Yes</span>
                    </FmCommonButton>
                    <FmCommonButton
                      variant="destructive-outline"
                      onClick={() => handleMakeDecision('rejected')}
                      disabled={makeDecision.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Reject</span>
                      <span className="sm:hidden">No</span>
                    </FmCommonButton>
                  </div>
                </div>
              </FmCommonCard>
            )}
          </div>
        </div>

        {/* Floating Timer Modal */}
        {isTimerActive && timerState && (
          <ReviewTimer
            submissionId={timerState.submissionId}
            submissionTitle={
              submission.artists.name +
              ' - ' +
              submission.artist_recordings.name
            }
            remainingSeconds={remainingSeconds}
            onReturnToSubmission={() => {
              // Already on the review page
            }}
            onCancel={cancelTimer}
          />
        )}
      </div>
    </Layout>
  );
}
