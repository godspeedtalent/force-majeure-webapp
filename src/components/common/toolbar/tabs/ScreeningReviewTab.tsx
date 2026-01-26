/**
 * Screening Review Tab - Toolbar Component
 *
 * Displays the current artist screening review workflow state:
 * - Active timer (if running)
 * - Pending reviews (completed timers awaiting review, within 3-day window)
 * - Empty state when no active/pending timers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Music,
  Play,
  ExternalLink,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Trash2,
  ExternalLinkIcon,
} from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { useReviewTimer } from '@/features/artist-screening/hooks';
import { cn } from '@/shared';
import type { CompletedTimerEntry } from '@/features/artist-screening/types';
import { ToolbarReviewModal } from './ToolbarReviewModal';

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
 * Format relative time since completion
 */
function formatTimeSince(completedAt: number): string {
  const diffMs = Date.now() - completedAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Format time until expiration (3 days from completion)
 */
function formatTimeUntilExpiration(completedAt: number): string {
  const expirationTime = completedAt + 3 * 24 * 60 * 60 * 1000;
  const remainingMs = expirationTime - Date.now();
  const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remainingDays = Math.floor(remainingHours / 24);

  if (remainingDays > 0) return `${remainingDays}d left`;
  if (remainingHours > 0) return `${remainingHours}h left`;
  return 'Expiring soon';
}

/**
 * Check if timer is close to expiration (less than 24 hours)
 */
function isNearExpiration(completedAt: number): boolean {
  const expirationTime = completedAt + 3 * 24 * 60 * 60 * 1000;
  const remainingMs = expirationTime - Date.now();
  return remainingMs < 24 * 60 * 60 * 1000;
}

// ============================================================================
// Props
// ============================================================================

interface ScreeningReviewTabContentProps {
  onNavigate: (path: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ScreeningReviewTabContent({ onNavigate }: ScreeningReviewTabContentProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const {
    timerState,
    remainingSeconds,
    isTimerActive,
    completedTimers,
    cancelTimer,
    relaunchRecording,
    clearCompletedTimer,
  } = useReviewTimer();

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    onNavigate(path);
    navigate(path);
  };

  const handleOpenReviewModal = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedSubmissionId(null);
  };

  const handleReviewSubmitted = (submissionId: string) => {
    // Clear the completed timer after review is submitted
    clearCompletedTimer(submissionId);
    handleCloseReviewModal();
  };

  const hasActiveTimer = isTimerActive && timerState;
  const hasPendingReviews = completedTimers.length > 0;
  const isEmpty = !hasActiveTimer && !hasPendingReviews;

  return (
    <div className="space-y-4">
      <Separator className="bg-white/10" />

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-8">
          <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-medium text-foreground mb-1">
            {t('screeningToolbar.noActiveTimers', 'No active review timers')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('screeningToolbar.startListening', 'Start a timer from the screening feed to review DJ sets.')}
          </p>
          <FmCommonButton
            variant="default"
            size="sm"
            onClick={() => handleNavigate('/staff')}
          >
            {t('screeningToolbar.viewAllScreenings', 'View All Screenings')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </FmCommonButton>
        </div>
      )}

      {/* Active Timer Section */}
      {hasActiveTimer && (
        <ActiveTimerSection
          timerState={timerState}
          remainingSeconds={remainingSeconds}
          onRelaunchRecording={relaunchRecording}
          onCancelTimer={cancelTimer}
          onNavigateToReview={() => handleNavigate(`/staff/screening/review/${timerState.submissionId}`)}
        />
      )}

      {/* Pending Reviews Section */}
      {hasPendingReviews && (
        <PendingReviewsSection
          completedTimers={completedTimers}
          onReviewNow={handleOpenReviewModal}
          onDismiss={clearCompletedTimer}
          onGoToSubmission={(submissionId) => handleNavigate(`/staff/screening/review/${submissionId}`)}
        />
      )}

      {/* Quick Actions */}
      {!isEmpty && (
        <>
          <Separator className="bg-white/10" />
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground hover:text-fm-gold"
              onClick={() => handleNavigate('/staff')}
            >
              {t('screeningToolbar.viewAllScreenings', 'View All Screenings')}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedSubmissionId && (
        <ToolbarReviewModal
          submissionId={selectedSubmissionId}
          open={reviewModalOpen}
          onClose={handleCloseReviewModal}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}

// ============================================================================
// Active Timer Section
// ============================================================================

interface ActiveTimerSectionProps {
  timerState: {
    submissionId: string;
    submissionTitle: string;
    artistName: string;
    coverArtUrl: string | null;
    recordingUrl: string;
  };
  remainingSeconds: number;
  onRelaunchRecording: () => void;
  onCancelTimer: () => void;
  onNavigateToReview: () => void;
}

function ActiveTimerSection({
  timerState,
  remainingSeconds,
  onRelaunchRecording,
  onCancelTimer,
  onNavigateToReview,
}: ActiveTimerSectionProps) {
  const { t } = useTranslation('common');
  const progress = calculateProgress(remainingSeconds);
  const isComplete = remainingSeconds === 0;

  return (
    <div className="bg-fm-gold/10 border border-fm-gold/30 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Play className="h-3.5 w-3.5 text-fm-gold" fill="currentColor" />
        <span className="text-[10px] font-medium text-fm-gold uppercase tracking-wider">
          {t('screeningToolbar.nowPlaying', 'Now Playing')}
        </span>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 mb-3">
        {/* Cover Art */}
        <div className="flex-shrink-0 w-12 h-12 bg-black/40 border border-white/10 overflow-hidden">
          {timerState.coverArtUrl ? (
            <img
              src={timerState.coverArtUrl}
              alt={timerState.submissionTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-5 w-5 text-fm-gold/50" />
            </div>
          )}
        </div>

        {/* Title + Artist + Timer */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate" title={timerState.submissionTitle}>
            {timerState.submissionTitle}
          </p>
          <p className="text-xs text-muted-foreground truncate" title={timerState.artistName}>
            {timerState.artistName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
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
            </span>
            <span className="text-[10px] text-white/40">
              {isComplete ? (
                <span className="text-green-400">{t('screeningToolbar.readyToReview', 'Ready!')}</span>
              ) : (
                `${progress}%`
              )}
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <FmCommonIconButton
          onClick={onCancelTimer}
          variant="secondary"
          size="sm"
          icon={X}
          aria-label={t('screeningToolbar.cancelTimer', 'Cancel Timer')}
          className="h-7 w-7"
        />
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 mb-3">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear',
            isComplete ? 'bg-green-400' : 'bg-fm-gold'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <FmCommonButton
          variant="default"
          size="sm"
          onClick={onRelaunchRecording}
          className="flex-1"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          {t('screeningToolbar.openRecording', 'Open Recording')}
        </FmCommonButton>
        <FmCommonButton
          variant="gold"
          size="sm"
          onClick={onNavigateToReview}
          className="flex-1"
        >
          {t('screeningToolbar.goToReview', 'Go to Review')}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </FmCommonButton>
      </div>
    </div>
  );
}

// ============================================================================
// Pending Reviews Section
// ============================================================================

interface PendingReviewsSectionProps {
  completedTimers: CompletedTimerEntry[];
  onReviewNow: (submissionId: string) => void;
  onDismiss: (submissionId: string) => void;
  onGoToSubmission: (submissionId: string) => void;
}

function PendingReviewsSection({
  completedTimers,
  onReviewNow,
  onDismiss,
  onGoToSubmission,
}: PendingReviewsSectionProps) {
  const { t } = useTranslation('common');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-fm-gold" />
        <span className="text-xs font-medium text-fm-gold uppercase tracking-wider">
          {t('screeningToolbar.pendingReviews', 'Pending Reviews')}
        </span>
        <span className="text-xs text-muted-foreground">
          ({completedTimers.length})
        </span>
      </div>

      {/* List */}
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2">
          {completedTimers.map((entry) => (
            <PendingReviewItem
              key={entry.submissionId}
              entry={entry}
              onReviewNow={() => onReviewNow(entry.submissionId)}
              onDismiss={() => onDismiss(entry.submissionId)}
              onGoToSubmission={() => onGoToSubmission(entry.submissionId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Pending Review Item
// ============================================================================

interface PendingReviewItemProps {
  entry: CompletedTimerEntry;
  onReviewNow: () => void;
  onDismiss: () => void;
  onGoToSubmission: () => void;
}

function PendingReviewItem({ entry, onReviewNow, onDismiss, onGoToSubmission }: PendingReviewItemProps) {
  const { t } = useTranslation('common');
  const isNearExp = isNearExpiration(entry.completedAt);

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 border transition-colors',
        isNearExp
          ? 'bg-fm-danger/10 border-fm-danger/30'
          : 'bg-black/40 border-white/10 hover:border-white/20'
      )}
    >
      {/* Cover Art */}
      <div className="flex-shrink-0 w-10 h-10 bg-black/40 border border-white/10 overflow-hidden">
        {entry.coverArtUrl ? (
          <img
            src={entry.coverArtUrl}
            alt={entry.submissionTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-4 w-4 text-fm-gold/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Recording name (title) */}
        <p className="text-sm text-white font-medium truncate" title={entry.submissionTitle}>
          {entry.submissionTitle}
        </p>
        {/* Artist name (subtitle) */}
        <p className="text-xs text-muted-foreground truncate" title={entry.artistName}>
          {entry.artistName}
        </p>
        {/* Time info */}
        <div className="flex items-center gap-2 text-[10px] mt-0.5">
          <span className="text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 inline mr-0.5 text-green-400" />
            {formatTimeSince(entry.completedAt)}
          </span>
          <span className={cn(isNearExp ? 'text-fm-danger' : 'text-muted-foreground')}>
            {isNearExp && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
            {formatTimeUntilExpiration(entry.completedAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Review Button */}
        <FmCommonButton
          variant="gold"
          size="sm"
          onClick={onReviewNow}
          className="text-xs px-2 h-7"
        >
          {t('screeningToolbar.reviewNow', 'Review')}
        </FmCommonButton>

        {/* Context Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'h-7 w-6 flex items-center justify-center',
                'text-muted-foreground hover:text-white',
                'hover:bg-white/10 transition-colors'
              )}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onGoToSubmission}>
              <ExternalLinkIcon className="h-4 w-4 mr-2" />
              {t('screeningToolbar.goToSubmission', 'Go to Submission')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDismiss}
              className="text-fm-danger focus:text-fm-danger"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('screeningToolbar.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
