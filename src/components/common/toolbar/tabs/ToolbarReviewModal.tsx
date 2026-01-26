/**
 * Toolbar Review Modal
 *
 * Modal for submitting a review from the toolbar without navigating away.
 * Provides a compact review form with the 3 qualitative metrics and notes.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Music } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { QualitativeMetricSelector } from '@/features/artist-screening/components/QualitativeMetricSelector';
import { REVIEW_METRIC_CONFIGS } from '@/features/artist-screening/config/reviewMetrics';
import {
  calculateTotalScore,
  createDefaultMetricScores,
} from '@/features/artist-screening/utils/reviewScoring';
import { useCreateReview, useSubmission } from '@/features/artist-screening/hooks';
import type {
  CreateReviewInput,
  ReviewMetricId,
  ReviewMetricScores,
} from '@/features/artist-screening/types';
import { cn, handleError } from '@/shared';
import { toast } from 'sonner';

// ============================================================================
// Props
// ============================================================================

interface ToolbarReviewModalProps {
  submissionId: string;
  open: boolean;
  onClose: () => void;
  onReviewSubmitted: (submissionId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ToolbarReviewModal({
  submissionId,
  open,
  onClose,
  onReviewSubmitted,
}: ToolbarReviewModalProps) {
  const { t } = useTranslation('common');

  // Fetch submission details for header display
  const { data: submission, isLoading: isLoadingSubmission } = useSubmission(submissionId);

  // Review mutation
  const createReview = useCreateReview();

  // Form state
  const [metricScores, setMetricScores] = useState<ReviewMetricScores>(() =>
    createDefaultMetricScores()
  );
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Calculate total score
  const totalMetricScore = useMemo(
    () => calculateTotalScore(metricScores),
    [metricScores]
  );

  // Handle metric change
  const handleMetricChange = (
    metricId: ReviewMetricId,
    score: ReviewMetricScores[ReviewMetricId]
  ) => {
    setMetricScores(previous => ({
      ...previous,
      [metricId]: score,
    }));
  };

  // Handle submit
  const handleSubmitReview = async () => {
    try {
      const input: CreateReviewInput = {
        submission_id: submissionId,
        rating: totalMetricScore,
        metric_scores: metricScores,
        internal_notes: internalNotes || undefined,
        listen_duration_seconds: 1200, // 20 minutes (timer duration)
      };

      await createReview.mutateAsync(input);

      // Reset form
      setMetricScores(createDefaultMetricScores());
      setInternalNotes('');

      toast.success(t('screeningToolbar.reviewSubmitted', 'Review submitted successfully'));
      onReviewSubmitted(submissionId);
    } catch (err) {
      handleError(err, {
        title: t('screeningToolbar.reviewFailed', 'Failed to submit review'),
        context: 'ToolbarReviewModal.handleSubmitReview',
      });
    }
  };

  // Cover art for header
  const coverArt = submission?.artist_recordings?.cover_art
    || submission?.artists?.image_url
    || null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          'max-w-lg p-0 bg-black/95 border-white/20 overflow-hidden',
          'max-h-[90vh] overflow-y-auto'
        )}
      >
        {/* Header with submission info */}
        <DialogHeader className="relative p-4 border-b border-white/10">
          {isLoadingSubmission ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ) : submission ? (
            <div className="flex items-center gap-3">
              {/* Cover Art */}
              <div className="flex-shrink-0 w-12 h-12 bg-black/40 border border-white/10 overflow-hidden">
                {coverArt ? (
                  <img
                    src={coverArt}
                    alt={submission.artist_recordings.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-5 w-5 text-fm-gold/50" />
                  </div>
                )}
              </div>

              {/* Title and Artist */}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-semibold text-white truncate">
                  {submission.artist_recordings.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground truncate">
                  {submission.artists.name}
                </DialogDescription>
              </div>
            </div>
          ) : (
            <DialogTitle className="text-base font-semibold text-white">
              {t('screeningToolbar.submitReview', 'Submit Review')}
            </DialogTitle>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isLoadingSubmission ? (
            <div className="flex items-center justify-center py-8">
              <FmCommonLoadingSpinner size="md" />
            </div>
          ) : (
            <>
              {/* Metric Selectors */}
              <div className="space-y-3">
                {REVIEW_METRIC_CONFIGS.map(metric => (
                  <QualitativeMetricSelector
                    key={metric.id}
                    metric={metric}
                    value={metricScores[metric.id]}
                    onChange={score => handleMetricChange(metric.id, score)}
                  />
                ))}
              </div>

              {/* Internal Notes */}
              <FmCommonTextField
                label={t('screeningToolbar.internalNotes', 'Internal Notes')}
                description={t('screeningToolbar.notesDescription', 'Only other reviewers can see these notes.')}
                value={internalNotes}
                onChange={event => setInternalNotes(event.target.value)}
                placeholder={t('screeningToolbar.notesPlaceholder', 'Share what stood out, deal-breakers, or context to remember...')}
                multiline
                rows={3}
              />

              {/* Score Display */}
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('screeningToolbar.totalScore', 'Total Score')}
                </span>
                <span className="text-lg font-bold text-fm-gold">
                  {totalMetricScore} / 12
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.cancel', 'Cancel')}
          </FmCommonButton>
          <FmCommonButton
            variant="gold"
            size="sm"
            onClick={handleSubmitReview}
            disabled={createReview.isPending || isLoadingSubmission}
            className="flex-1"
          >
            <Star className="h-4 w-4 mr-1.5" />
            {createReview.isPending
              ? t('screeningToolbar.submitting', 'Submitting...')
              : t('screeningToolbar.submitReview', 'Submit Review')}
          </FmCommonButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
