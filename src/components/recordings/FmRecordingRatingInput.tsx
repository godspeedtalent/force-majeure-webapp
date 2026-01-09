/**
 * FmRecordingRatingInput
 *
 * Rating input component for the internal DJ vetting system.
 * Allows developers and admins to rate recordings from 1-10.
 * Supports create/update (upsert) behavior.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Save, X, Edit3, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useAuth } from '@/features/auth/services/AuthContext';
import {
  useUserRatingForRecording,
  useUpsertRating,
} from '@/shared/api/queries/recordingRatingQueries';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';

interface FmRecordingRatingInputProps {
  /** Recording ID to rate */
  recordingId: string;
  /** Callback when rating is saved */
  onRatingSaved?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function FmRecordingRatingInput({
  recordingId,
  onRatingSaved,
  className,
}: FmRecordingRatingInputProps) {
  const { t } = useTranslation('pages');
  const { user } = useAuth();
  const { hasAnyRole } = useUserPermissions();

  // Check if user can rate
  const canRate = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  // Fetch existing rating
  const { data: existingRating, isLoading } = useUserRatingForRecording(
    recordingId,
    user?.id
  );

  // Upsert mutation
  const upsertRating = useUpsertRating();

  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  // Sync with existing rating
  useEffect(() => {
    if (existingRating) {
      setSelectedScore(existingRating.score);
      setNotes(existingRating.notes || '');
    }
  }, [existingRating]);

  // Don't render if user can't rate
  if (!canRate) {
    return null;
  }

  const handleSave = async () => {
    if (!selectedScore) {
      toast.error(t('recordingRatings.selectScore', 'Please select a score'));
      return;
    }

    try {
      await upsertRating.mutateAsync({
        recording_id: recordingId,
        score: selectedScore,
        notes: notes.trim() || undefined,
      });

      toast.success(
        existingRating
          ? t('recordingRatings.ratingUpdated', 'Rating updated')
          : t('recordingRatings.ratingSaved', 'Rating saved')
      );

      setIsEditing(false);
      onRatingSaved?.();
    } catch (error) {
      toast.error(t('recordingRatings.saveFailed', 'Failed to save rating'));
    }
  };

  const handleCancel = () => {
    // Reset to existing values
    setSelectedScore(existingRating?.score ?? null);
    setNotes(existingRating?.notes || '');
    setIsEditing(false);
  };

  const displayScore = hoveredScore ?? selectedScore;

  // Show view mode if has existing rating and not editing
  if (existingRating && !isEditing) {
    return (
      <FmCommonCard className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t('recordingRatings.yourRating', 'Your rating')}
          </h3>
          <FmCommonButton
            variant="secondary"
            size="sm"
            icon={Edit3}
            onClick={() => setIsEditing(true)}
          >
            {t('buttons.edit', 'Edit')}
          </FmCommonButton>
        </div>

        <div className="flex items-center gap-4">
          {/* Score display */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <Star
                  key={score}
                  className={cn(
                    'h-5 w-5 transition-colors',
                    score <= existingRating.score
                      ? 'fill-fm-gold text-fm-gold'
                      : 'text-white/20'
                  )}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-fm-gold">
              {existingRating.score}/10
            </span>
          </div>
        </div>

        {/* Notes display */}
        {existingRating.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="italic">{existingRating.notes}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t('recordingRatings.lastUpdated', 'Last updated')}{' '}
          {new Date(existingRating.updated_at).toLocaleDateString()}
        </p>
      </FmCommonCard>
    );
  }

  // Edit/Create mode
  return (
    <FmCommonCard className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {existingRating
          ? t('recordingRatings.editRating', 'Edit your rating')
          : t('recordingRatings.addRating', 'Rate this recording')}
      </h3>

      {isLoading ? (
        <div className="h-12 animate-pulse bg-white/5 rounded" />
      ) : (
        <>
          {/* Score selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setSelectedScore(score)}
                    onMouseEnter={() => setHoveredScore(score)}
                    onMouseLeave={() => setHoveredScore(null)}
                    className={cn(
                      'p-1 transition-all duration-200',
                      'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-fm-gold/50',
                      'rounded-sm'
                    )}
                    aria-label={`Rate ${score} out of 10`}
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-colors',
                        displayScore && score <= displayScore
                          ? 'fill-fm-gold text-fm-gold'
                          : 'text-white/20 hover:text-white/40'
                      )}
                    />
                  </button>
                ))}
              </div>
              {displayScore && (
                <span className="text-2xl font-bold text-fm-gold ml-2">
                  {displayScore}/10
                </span>
              )}
            </div>

            {/* Score labels */}
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>{t('recordingRatings.poor', 'Poor')}</span>
              <span>{t('recordingRatings.excellent', 'Excellent')}</span>
            </div>
          </div>

          {/* Notes textarea */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('recordingRatings.notes', 'Notes')} ({t('common.optional', 'optional')})
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t(
                'recordingRatings.notesPlaceholder',
                'Add notes about mixing quality, track selection, energy...'
              )}
              className={cn(
                'w-full min-h-[80px] p-3',
                'bg-black/40 border border-white/20',
                'text-sm text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:border-fm-gold focus:border-b-[3px]',
                'focus:shadow-[0_4px_16px_rgba(223,186,125,0.3)]',
                'transition-all duration-200',
                'rounded-none resize-none'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <FmCommonButton
              variant="gold"
              onClick={handleSave}
              disabled={!selectedScore || upsertRating.isPending}
              icon={Save}
            >
              {upsertRating.isPending
                ? t('buttons.saving', 'Saving...')
                : t('buttons.save', 'Save')}
            </FmCommonButton>

            {(existingRating || isEditing) && (
              <FmCommonButton
                variant="secondary"
                onClick={handleCancel}
                icon={X}
              >
                {t('buttons.cancel', 'Cancel')}
              </FmCommonButton>
            )}
          </div>
        </>
      )}
    </FmCommonCard>
  );
}
