/**
 * Example: How to use the useUpdateReview hook
 *
 * This is a reference implementation showing how to edit an existing review.
 * You can integrate this pattern into your ReviewInterface or create a separate edit modal.
 */

import { useState } from 'react';
import { useUpdateReview } from '../hooks';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { UpdateReviewInput, ScreeningReview, ReviewMetricScores } from '../types';
import { QualitativeMetricSelector } from './QualitativeMetricSelector';
import { REVIEW_METRIC_CONFIGS } from '../config/reviewMetrics';
import { calculateTotalScore } from '../utils/reviewScoring';

interface EditReviewFormProps {
  review: ScreeningReview;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditReviewForm({ review, onSuccess, onCancel }: EditReviewFormProps) {
  const updateReview = useUpdateReview();

  // Initialize state from existing review
  const [metricScores, setMetricScores] = useState<ReviewMetricScores>({
    trackSelection: review.track_selection_score ?? 0,
    flowEnergy: review.flow_energy_score ?? 0,
    technicalExecution: review.technical_execution_score ?? 0,
  });
  const [internalNotes, setInternalNotes] = useState(review.internal_notes || '');

  const totalScore = calculateTotalScore(metricScores);

  const handleSubmit = async () => {
    const input: UpdateReviewInput = {
      review_id: review.id,
      rating: totalScore,
      metric_scores: metricScores,
      internal_notes: internalNotes || undefined,
      // listen_duration_seconds can be updated if needed
    };

    try {
      await updateReview.mutateAsync(input);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to update review:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Edit Your Review</h3>

        {/* Metric Selectors */}
        {REVIEW_METRIC_CONFIGS.map(metric => (
          <QualitativeMetricSelector
            key={metric.id}
            metric={metric}
            value={metricScores[metric.id]}
            onChange={score =>
              setMetricScores(prev => ({ ...prev, [metric.id]: score }))
            }
          />
        ))}

        {/* Internal Notes */}
        <FmCommonTextField
          label="Internal Notes"
          description="Only other reviewers can see these notes."
          value={internalNotes}
          onChange={e => setInternalNotes(e.target.value)}
          placeholder="Share what stood out, deal-breakers, or context to remember..."
          multiline
          rows={4}
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <FmCommonButton
            variant="gold"
            onClick={handleSubmit}
            disabled={updateReview.isPending}
          >
            {updateReview.isPending ? 'Updating...' : 'Update Review'}
          </FmCommonButton>

          {onCancel && (
            <FmCommonButton
              variant="secondary"
              onClick={onCancel}
              disabled={updateReview.isPending}
            >
              Cancel
            </FmCommonButton>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Usage Example in ReviewInterface:
 *
 * 1. Add edit button to your review display
 * 2. Show the EditReviewForm in a modal or inline
 * 3. The review will be updated and scores recalculated automatically
 *
 * Example:
 * ```tsx
 * const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
 *
 * // In your review list
 * {reviewStats.sortedReviews.map(review => (
 *   <div key={review.id}>
 *     {review.reviewer_id === currentUserId && (
 *       <button onClick={() => setEditingReviewId(review.id)}>
 *         Edit
 *       </button>
 *     )}
 *   </div>
 * ))}
 *
 * // In a modal
 * {editingReviewId && (
 *   <Modal>
 *     <EditReviewForm
 *       review={reviewStats.sortedReviews.find(r => r.id === editingReviewId)!}
 *       onSuccess={() => setEditingReviewId(null)}
 *       onCancel={() => setEditingReviewId(null)}
 *     />
 *   </Modal>
 * )}
 * ```
 */
