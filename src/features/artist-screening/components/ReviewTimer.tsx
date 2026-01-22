/**
 * Review Timer Modal
 *
 * Floating modal that displays the active review timer.
 * Positioned in bottom-left corner, persists across navigation.
 * Semi-transparent by default, opaque on hover.
 */

import { ArrowLeft, X } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';

// ============================================================================
// Types
// ============================================================================

interface ReviewTimerProps {
  /**
   * Submission ID being reviewed
   */
  submissionId: string;

  /**
   * Submission title/name (for display)
   */
  submissionTitle: string;

  /**
   * Remaining seconds on timer
   */
  remainingSeconds: number;

  /**
   * Callback when "Return to Submission" clicked
   */
  onReturnToSubmission: () => void;

  /**
   * Callback when "Cancel Timer" clicked
   */
  onCancel: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage (0-100)
 */
function calculateProgress(remaining: number, total: number = 1200): number {
  return Math.round(((total - remaining) / total) * 100);
}

// ============================================================================
// Component
// ============================================================================

export function ReviewTimer({
  submissionId: _submissionId,
  submissionTitle,
  remainingSeconds,
  onReturnToSubmission,
  onCancel,
}: ReviewTimerProps) {
  const progress = calculateProgress(remainingSeconds);
  const isComplete = remainingSeconds === 0;

  return (
    <div
      className={cn(
        'fixed bottom-[20px] left-[20px] z-50',
        'w-[320px]',
        'bg-black/60 backdrop-blur-sm',
        'border-2 border-fm-gold',
        'transition-all duration-300',
        'hover:bg-black/80 hover:backdrop-blur-md',
        'shadow-[0_0_20px_rgba(223,186,125,0.3)]'
      )}
    >
      {/* Header */}
      <div className="p-[15px] border-b border-white/20">
        <div className="flex items-center justify-between mb-[10px]">
          <h4 className="text-sm font-medium text-fm-gold uppercase">
            Review Timer
          </h4>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/10 transition-colors rounded-none"
            title="Cancel timer"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        <p className="text-xs text-white/60 truncate" title={submissionTitle}>
          {submissionTitle}
        </p>
      </div>

      {/* Timer Display */}
      <div className="p-[20px]">
        {/* Time Remaining */}
        <div className="text-center mb-[15px]">
          <div
            className={cn(
              'text-4xl font-bold font-mono mb-[5px]',
              isComplete
                ? 'text-green-400'
                : remainingSeconds < 60
                ? 'text-fm-danger animate-pulse'
                : 'text-fm-gold'
            )}
          >
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-xs text-muted-foreground uppercase">
            {isComplete ? 'Timer Complete' : 'Remaining'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-black/40 rounded-none mb-[15px] overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              isComplete ? 'bg-green-400' : 'bg-fm-gold'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <div className="text-xs text-center text-white/60 mb-[15px]">
          {progress}% complete
        </div>

        {/* Actions */}
        <div className="space-y-[10px]">
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={onReturnToSubmission}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Submission
          </FmCommonButton>

          {isComplete && (
            <div className="text-xs text-center text-green-400 font-medium">
              You can now submit your review!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
