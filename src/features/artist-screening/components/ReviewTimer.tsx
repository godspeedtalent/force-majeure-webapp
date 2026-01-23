/**
 * Review Timer Modal
 *
 * Floating modal that displays the active review timer.
 * Positioned in bottom-left corner, persists across navigation.
 * Semi-transparent by default, opaque on hover.
 */

import { ArrowLeft, X } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
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
        // Mobile: center at bottom with full width minus margins
        'fixed bottom-[10px] left-[10px] right-[10px] z-50',
        // Desktop: fixed width at bottom-left
        'md:bottom-[20px] md:left-[20px] md:right-auto',
        'md:w-[320px]',
        // Styling
        'bg-black/70 backdrop-blur-md md:bg-black/60 md:backdrop-blur-sm',
        'border-2 border-fm-gold',
        'transition-all duration-300',
        'hover:bg-black/80 hover:backdrop-blur-md',
        'shadow-[0_0_20px_rgba(223,186,125,0.3)]'
      )}
    >
      {/* Header */}
      <div className="p-[10px] md:p-[15px] border-b border-white/20">
        <div className="flex items-center justify-between mb-[5px] md:mb-[10px]">
          <h4 className="text-xs md:text-sm font-medium text-fm-gold uppercase">
            Review Timer
          </h4>
          <FmCommonIconButton
            onClick={onCancel}
            variant="secondary"
            size="sm"
            icon={X}
            aria-label="Cancel timer"
          />
        </div>

        <p className="text-[10px] md:text-xs text-white/60 truncate" title={submissionTitle}>
          {submissionTitle}
        </p>
      </div>

      {/* Timer Display */}
      <div className="p-[10px] md:p-[20px]">
        {/* Time Remaining */}
        <div className="text-center mb-[10px] md:mb-[15px]">
          <div
            className={cn(
              'text-3xl md:text-4xl font-bold font-mono mb-[5px]',
              isComplete
                ? 'text-green-400'
                : remainingSeconds < 60
                ? 'text-fm-danger animate-pulse'
                : 'text-fm-gold'
            )}
          >
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase">
            {isComplete ? 'Timer Complete' : 'Remaining'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 md:h-2 bg-black/40 rounded-none mb-[10px] md:mb-[15px] overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              isComplete ? 'bg-green-400' : 'bg-fm-gold'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <div className="text-[10px] md:text-xs text-center text-white/60 mb-[10px] md:mb-[15px]">
          {progress}% complete
        </div>

        {/* Actions */}
        <div className="space-y-[8px] md:space-y-[10px]">
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={onReturnToSubmission}
            className="w-full"
          >
            <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
            <span className="hidden sm:inline">Return to Submission</span>
            <span className="sm:hidden">Return</span>
          </FmCommonButton>

          {isComplete && (
            <div className="text-[10px] md:text-xs text-center text-green-400 font-medium">
              You can now submit your review!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
