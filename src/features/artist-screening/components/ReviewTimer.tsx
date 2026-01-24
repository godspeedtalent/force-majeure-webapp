/**
 * Review Timer - "Now Playing" Widget
 *
 * Floating widget that displays the active review timer.
 * Positioned in bottom-left corner, persists across navigation.
 * Styled as a "Now Playing" music widget.
 * Features:
 * - Minimize/expand toggle
 * - Cancel confirmation
 * - Admin-only Override Timer
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, X, Music, Play, Minus, Maximize2, Shield } from 'lucide-react';
import { SiSpotify, SiSoundcloud, SiYoutube } from 'react-icons/si';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { cn } from '@/shared';

// ============================================================================
// Constants
// ============================================================================

const MINIMIZED_KEY = 'fm_review_timer_minimized';

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
   * Recording URL (for platform detection)
   */
  recordingUrl: string;

  /**
   * Remaining seconds on timer
   */
  remainingSeconds: number;

  /**
   * Whether the current user is an admin
   */
  isAdmin?: boolean;

  /**
   * Callback when "Return to Submission" clicked
   */
  onReturnToSubmission: () => void;

  /**
   * Callback when "Relaunch Recording" clicked
   */
  onRelaunchRecording: () => void;

  /**
   * Callback when "Cancel Timer" confirmed
   */
  onCancel: () => void;

  /**
   * Callback when admin overrides timer (marks as complete without waiting)
   */
  onOverrideTimer?: () => void;
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

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): 'spotify' | 'soundcloud' | 'youtube' | 'unknown' {
  if (url.includes('spotify')) return 'spotify';
  if (url.includes('soundcloud')) return 'soundcloud';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

/**
 * Get platform icon
 */
function getPlatformIcon(platform: 'spotify' | 'soundcloud' | 'youtube' | 'unknown') {
  switch (platform) {
    case 'spotify':
      return <SiSpotify className="h-4 w-4 text-green-400" />;
    case 'soundcloud':
      return <SiSoundcloud className="h-4 w-4 text-orange-400" />;
    case 'youtube':
      return <SiYoutube className="h-4 w-4 text-red-400" />;
    default:
      return <Music className="h-4 w-4 text-fm-gold" />;
  }
}

// ============================================================================
// Component
// ============================================================================

export function ReviewTimer({
  submissionId: _submissionId,
  submissionTitle,
  recordingUrl,
  remainingSeconds,
  isAdmin = false,
  onReturnToSubmission,
  onRelaunchRecording,
  onCancel,
  onOverrideTimer,
}: ReviewTimerProps) {
  const progress = calculateProgress(remainingSeconds);
  const isComplete = remainingSeconds === 0;
  const platform = detectPlatform(recordingUrl);

  // Minimized state (persisted in localStorage)
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem(MINIMIZED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Confirmation modals
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  // Persist minimized state
  useEffect(() => {
    try {
      localStorage.setItem(MINIMIZED_KEY, isMinimized ? 'true' : 'false');
    } catch {
      // Ignore localStorage errors
    }
  }, [isMinimized]);

  // Handle cancel click - show confirmation
  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  // Handle cancel confirmed
  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  // Handle override click - show confirmation
  const handleOverrideClick = () => {
    setShowOverrideConfirm(true);
  };

  // Handle override confirmed
  const handleOverrideConfirm = () => {
    setShowOverrideConfirm(false);
    onOverrideTimer?.();
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className={cn(
          'fixed bottom-[10px] left-[10px] z-50',
          'md:bottom-[20px] md:left-[20px]',
          'bg-black/80 backdrop-blur-lg',
          'border border-fm-gold/40',
          'transition-all duration-300',
          'hover:border-fm-gold hover:shadow-[0_0_30px_rgba(223,186,125,0.3)]',
          'shadow-[0_0_15px_rgba(0,0,0,0.5)]',
          'cursor-pointer'
        )}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-[10px] px-[12px] py-[10px]">
          {/* Platform Icon */}
          <div className="flex-shrink-0 w-8 h-8 bg-black/40 border border-white/10 flex items-center justify-center">
            {getPlatformIcon(platform)}
          </div>

          {/* Timer */}
          <div
            className={cn(
              'text-lg font-bold font-mono',
              isComplete
                ? 'text-green-400'
                : remainingSeconds < 60
                ? 'text-fm-danger animate-pulse'
                : 'text-white'
            )}
          >
            {formatTime(remainingSeconds)}
          </div>

          {/* Expand Button */}
          <Maximize2 className="h-4 w-4 text-white/40" />
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              isComplete ? 'bg-green-400' : 'bg-fm-gold'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Full view
  return (
    <>
      <div
        className={cn(
          // Mobile: center at bottom with full width minus margins
          'fixed bottom-[10px] left-[10px] right-[10px] z-50',
          // Desktop: fixed width at bottom-left
          'md:bottom-[20px] md:left-[20px] md:right-auto',
          'md:w-[320px]',
          // Styling - "Now Playing" widget feel
          'bg-black/80 backdrop-blur-lg',
          'border border-fm-gold/40',
          'transition-all duration-300',
          'hover:border-fm-gold hover:shadow-[0_0_30px_rgba(223,186,125,0.3)]',
          'shadow-[0_0_15px_rgba(0,0,0,0.5)]'
        )}
      >
        {/* Header - "Now Playing" */}
        <div className="flex items-center justify-between px-[12px] py-[8px] border-b border-white/10 bg-fm-gold/10">
          <div className="flex items-center gap-[8px]">
            <Play className="h-3.5 w-3.5 text-fm-gold" fill="currentColor" />
            <span className="text-[10px] font-medium text-fm-gold uppercase tracking-wider">
              Now Playing
            </span>
          </div>
          <div className="flex items-center gap-[4px]">
            {/* Minimize Button */}
            <FmCommonIconButton
              onClick={() => setIsMinimized(true)}
              variant="secondary"
              size="sm"
              icon={Minus}
              aria-label="Minimize timer"
              className="h-6 w-6"
            />
            {/* Close Button */}
            <FmCommonIconButton
              onClick={handleCancelClick}
              variant="secondary"
              size="sm"
              icon={X}
              aria-label="Cancel timer"
              className="h-6 w-6"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-[12px]">
          {/* Title + Platform */}
          <div className="flex items-start gap-[10px] mb-[12px]">
            {/* Platform Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-black/40 border border-white/10 flex items-center justify-center">
              {getPlatformIcon(platform)}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate" title={submissionTitle}>
                {submissionTitle}
              </p>
              <p className="text-[10px] text-white/40 uppercase">
                DJ Set Review
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-[10px]">
            <div className="w-full h-1 bg-white/10 rounded-none overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-1000 ease-linear',
                  isComplete ? 'bg-green-400' : 'bg-fm-gold'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timer + Status */}
          <div className="flex items-center justify-between mb-[12px]">
            <div
              className={cn(
                'text-2xl font-bold font-mono',
                isComplete
                  ? 'text-green-400'
                  : remainingSeconds < 60
                  ? 'text-fm-danger animate-pulse'
                  : 'text-white'
              )}
            >
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-[10px] text-white/40">
              {isComplete ? (
                <span className="text-green-400 font-medium">Ready to review!</span>
              ) : (
                <span>{progress}% complete</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-[8px]">
            <FmCommonButton
              variant="default"
              size="sm"
              onClick={onRelaunchRecording}
              className="flex-1"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-[5px]" />
              Open Recording
            </FmCommonButton>
            <FmCommonButton
              variant="gold"
              size="sm"
              onClick={onReturnToSubmission}
              className="flex-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-[5px]" />
              Review
            </FmCommonButton>
          </div>

          {/* Admin Override Button */}
          {isAdmin && onOverrideTimer && !isComplete && (
            <div className="mt-[10px] pt-[10px] border-t border-white/10">
              <FmCommonButton
                variant="default"
                size="sm"
                onClick={handleOverrideClick}
                className="w-full text-fm-gold border-fm-gold/40 hover:bg-fm-gold/10"
              >
                <Shield className="h-3.5 w-3.5 mr-[5px]" />
                Override Timer (Admin)
              </FmCommonButton>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <TimerCancelConfirm
          submissionTitle={submissionTitle}
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* Override Confirmation Modal */}
      {showOverrideConfirm && (
        <TimerOverrideConfirm
          submissionTitle={submissionTitle}
          onConfirm={handleOverrideConfirm}
          onCancel={() => setShowOverrideConfirm(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// Cancel Confirmation Modal
// ============================================================================

interface TimerCancelConfirmProps {
  submissionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function TimerCancelConfirm({
  submissionTitle,
  onConfirm,
  onCancel,
}: TimerCancelConfirmProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[20px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-black/90 border border-fm-danger/40 p-[20px] max-w-md w-full shadow-[0_0_40px_rgba(214,73,51,0.2)]">
        <h3 className="text-lg font-canela text-white mb-[10px]">
          Cancel timer?
        </h3>
        <p className="text-sm text-white/60 mb-[15px]">
          Are you sure you want to cancel the timer for:
        </p>
        <p className="text-sm text-fm-gold mb-[15px] truncate" title={submissionTitle}>
          "{submissionTitle}"
        </p>
        <p className="text-sm text-white/60 mb-[20px]">
          Your listen time progress will be lost and you'll need to start over.
        </p>

        <div className="flex items-center gap-[10px]">
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            Keep Listening
          </FmCommonButton>
          <FmCommonButton
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="flex-1"
          >
            Cancel Timer
          </FmCommonButton>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Override Confirmation Modal (Admin Only)
// ============================================================================

interface TimerOverrideConfirmProps {
  submissionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function TimerOverrideConfirm({
  submissionTitle,
  onConfirm,
  onCancel,
}: TimerOverrideConfirmProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[20px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-black/90 border border-fm-gold/40 p-[20px] max-w-md w-full shadow-[0_0_40px_rgba(223,186,125,0.2)]">
        <div className="flex items-center gap-[10px] mb-[15px]">
          <Shield className="h-5 w-5 text-fm-gold" />
          <h3 className="text-lg font-canela text-white">
            Override timer?
          </h3>
        </div>
        <p className="text-sm text-white/60 mb-[15px]">
          As an admin, you can bypass the 20-minute listen requirement for:
        </p>
        <p className="text-sm text-fm-gold mb-[15px] truncate" title={submissionTitle}>
          "{submissionTitle}"
        </p>
        <p className="text-sm text-white/60 mb-[20px]">
          This will mark the timer as complete, allowing you to submit a review immediately.
        </p>

        <div className="flex items-center gap-[10px]">
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            variant="gold"
            size="sm"
            onClick={onConfirm}
            className="flex-1"
          >
            <Shield className="h-3.5 w-3.5 mr-[5px]" />
            Override
          </FmCommonButton>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Timer Switch Confirmation Modal
// ============================================================================

interface TimerSwitchConfirmProps {
  /**
   * Current submission title being played
   */
  currentTitle: string;

  /**
   * New submission title to switch to
   */
  newTitle: string;

  /**
   * Callback when confirmed
   */
  onConfirm: () => void;

  /**
   * Callback when cancelled
   */
  onCancel: () => void;
}

export function TimerSwitchConfirm({
  currentTitle,
  newTitle,
  onConfirm,
  onCancel,
}: TimerSwitchConfirmProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[20px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-black/90 border border-fm-gold/40 p-[20px] max-w-md w-full shadow-[0_0_40px_rgba(223,186,125,0.2)]">
        <h3 className="text-lg font-canela text-white mb-[10px]">
          Switch recording?
        </h3>
        <p className="text-sm text-white/60 mb-[15px]">
          You're currently listening to:
        </p>
        <p className="text-sm text-fm-gold mb-[15px] truncate" title={currentTitle}>
          "{currentTitle}"
        </p>
        <p className="text-sm text-white/60 mb-[15px]">
          Switching will end your current timer and start a new one for:
        </p>
        <p className="text-sm text-white mb-[20px] truncate" title={newTitle}>
          "{newTitle}"
        </p>

        <div className="flex items-center gap-[10px]">
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            Keep Listening
          </FmCommonButton>
          <FmCommonButton
            variant="gold"
            size="sm"
            onClick={onConfirm}
            className="flex-1"
          >
            Switch Recording
          </FmCommonButton>
        </div>
      </div>
    </div>
  );
}
