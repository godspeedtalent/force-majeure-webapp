import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/shared';
import type { ReviewTimerState, CompletedTimerEntry } from '../types';

/**
 * Artist Screening - Review Timer Hook
 *
 * Manages the 20-minute listen timer requirement before staff can submit reviews.
 * Timer state persists in localStorage, allowing navigation away from the review page.
 *
 * Features:
 * - Opens recording URL in new tab when started
 * - 20-minute (1200 second) countdown
 * - Persists across page navigation
 * - Blocks starting new timers while one is active
 * - Provides cancel and complete functionality
 *
 * Usage:
 * ```ts
 * const {
 *   timerState,
 *   remainingSeconds,
 *   isTimerActive,
 *   isTimerCompleted,
 *   startTimer,
 *   cancelTimer,
 *   completeTimer,
 * } = useReviewTimer();
 *
 * // Start timer for a submission
 * startTimer(submissionId, recordingUrl);
 *
 * // Check if timer is active for specific submission
 * const canReview = isTimerCompleted(submissionId);
 * ```
 */

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'fm_review_timer';
const TIMER_DURATION_SECONDS = 1200; // 20 minutes
const TICK_INTERVAL_MS = 1000; // Update every second
const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

// ============================================================================
// localStorage Utilities
// ============================================================================

/**
 * Pending timer request (when user tries to start while one is active)
 */
export interface PendingTimerRequest {
  submissionId: string;
  submissionTitle: string;
  artistName: string;
  coverArtUrl: string | null;
  recordingUrl: string;
}

/**
 * Load timer state from localStorage
 */
function loadTimerState(): ReviewTimerState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as ReviewTimerState;

    // Validate structure
    if (
      !state.submissionId ||
      typeof state.startTime !== 'number' ||
      typeof state.duration !== 'number'
    ) {
      logger.warn('Invalid timer state in localStorage, clearing', {
        source: 'useReviewTimer.loadTimerState',
      });
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Migrate old timer states that don't have title/url/artist/cover
    if (!state.submissionTitle) {
      state.submissionTitle = 'Unknown';
    }
    if (!state.recordingUrl) {
      state.recordingUrl = '';
    }
    if (!state.artistName) {
      state.artistName = 'Unknown Artist';
    }
    if (state.coverArtUrl === undefined) {
      state.coverArtUrl = null;
    }

    return state;
  } catch (error) {
    logger.error('Failed to load timer state', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'useReviewTimer.loadTimerState',
    });
    return null;
  }
}

/**
 * Save timer state to localStorage
 */
function saveTimerState(state: ReviewTimerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error('Failed to save timer state', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'useReviewTimer.saveTimerState',
    });
  }
}

/**
 * Clear timer state from localStorage
 */
function clearTimerState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear timer state', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'useReviewTimer.clearTimerState',
    });
  }
}

// ============================================================================
// Completed Timers Tracking (with staleness)
// ============================================================================

const COMPLETED_KEY = 'fm_completed_review_timers';

/**
 * Check if a completed timer entry is stale (older than 3 days)
 */
function isEntryStale(entry: CompletedTimerEntry): boolean {
  return Date.now() - entry.completedAt > STALE_THRESHOLD_MS;
}

/**
 * Load completed timers from localStorage, with migration from old format
 * and automatic pruning of stale entries
 */
function loadCompletedTimers(): CompletedTimerEntry[] {
  try {
    const stored = localStorage.getItem(COMPLETED_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Check if old format (array of strings) and migrate
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      logger.info('Migrating completed timers from old format', {
        source: 'useReviewTimer.loadCompletedTimers',
        count: parsed.length,
      });
      // Migrate: convert string IDs to new format with current timestamp
      // These migrated entries will expire in 3 days from migration
      const migrated: CompletedTimerEntry[] = (parsed as string[]).map(submissionId => ({
        submissionId,
        submissionTitle: 'Migrated submission',
        artistName: 'Unknown Artist',
        coverArtUrl: null,
        recordingUrl: '',
        completedAt: Date.now(),
      }));
      saveCompletedTimersArray(migrated);
      return migrated;
    }

    // New format: array of CompletedTimerEntry
    // Migrate entries missing new fields (artistName, coverArtUrl)
    let needsSave = false;
    const entries = (parsed as CompletedTimerEntry[]).map(entry => {
      if (!entry.artistName || entry.coverArtUrl === undefined) {
        needsSave = true;
        return {
          ...entry,
          artistName: entry.artistName || 'Unknown Artist',
          coverArtUrl: entry.coverArtUrl ?? null,
        };
      }
      return entry;
    });

    // Prune stale entries
    const validEntries = entries.filter(entry => !isEntryStale(entry));
    if (validEntries.length !== entries.length || needsSave) {
      if (validEntries.length !== entries.length) {
        logger.info('Pruned stale completed timers', {
          source: 'useReviewTimer.loadCompletedTimers',
          removed: entries.length - validEntries.length,
        });
      }
      saveCompletedTimersArray(validEntries);
    }

    return validEntries;
  } catch {
    return [];
  }
}

/**
 * Save completed timers array to localStorage
 */
function saveCompletedTimersArray(entries: CompletedTimerEntry[]): void {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(entries));
  } catch (error) {
    logger.error('Failed to save completed timers', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'useReviewTimer.saveCompletedTimers',
    });
  }
}

/**
 * Mark submission timer as completed with full details
 */
function markTimerCompletedWithDetails(
  submissionId: string,
  submissionTitle: string,
  artistName: string,
  coverArtUrl: string | null,
  recordingUrl: string
): void {
  const entries = loadCompletedTimers();
  // Remove existing entry for this submission if any
  const filtered = entries.filter(e => e.submissionId !== submissionId);
  filtered.push({
    submissionId,
    submissionTitle,
    artistName,
    coverArtUrl,
    recordingUrl,
    completedAt: Date.now(),
  });
  saveCompletedTimersArray(filtered);
}

/**
 * Remove a completed timer entry (after review submitted)
 */
function removeCompletedTimer(submissionId: string): void {
  const entries = loadCompletedTimers();
  const filtered = entries.filter(e => e.submissionId !== submissionId);
  saveCompletedTimersArray(filtered);
}

/**
 * Check if submission timer is completed (and not stale)
 */
function isSubmissionTimerCompleted(submissionId: string): boolean {
  const entries = loadCompletedTimers();
  return entries.some(e => e.submissionId === submissionId);
}

/**
 * Check if a specific submission's completed timer is stale
 */
function isSubmissionTimerStale(submissionId: string): boolean {
  const entries = loadCompletedTimers();
  const entry = entries.find(e => e.submissionId === submissionId);
  if (!entry) return true; // Not found = treat as stale
  return isEntryStale(entry);
}

// ============================================================================
// Hook
// ============================================================================

interface UseReviewTimerReturn {
  /**
   * Current timer state (null if no timer active)
   */
  timerState: ReviewTimerState | null;

  /**
   * Remaining seconds on the timer (0 if no timer active)
   */
  remainingSeconds: number;

  /**
   * Whether a timer is currently running
   */
  isTimerActive: boolean;

  /**
   * Pending timer request (when trying to start while active)
   */
  pendingRequest: PendingTimerRequest | null;

  /**
   * List of completed timers that can still be reviewed (within 3-day window)
   */
  completedTimers: CompletedTimerEntry[];

  /**
   * Request to start a new timer for a submission
   * If a timer is active, sets pendingRequest for confirmation
   * Otherwise starts immediately
   * @param submissionId - Submission ID
   * @param submissionTitle - Recording name for display
   * @param artistName - Artist name for display
   * @param coverArtUrl - Cover art URL (can be null)
   * @param recordingUrl - URL to open in new tab
   * @returns 'started' | 'pending' | 'completed' | 'failed'
   */
  requestTimer: (submissionId: string, submissionTitle: string, artistName: string, coverArtUrl: string | null, recordingUrl: string) => 'started' | 'pending' | 'completed' | 'failed';

  /**
   * Confirm the pending timer switch
   * Cancels current timer and starts the pending one
   */
  confirmPendingTimer: () => void;

  /**
   * Cancel the pending timer request
   */
  cancelPendingRequest: () => void;

  /**
   * Cancel the active timer
   * Clears state and allows starting new timers
   */
  cancelTimer: () => void;

  /**
   * Complete the active timer
   * Marks submission as reviewed and clears active timer
   */
  completeTimer: () => void;

  /**
   * Relaunch the recording URL in a new tab
   */
  relaunchRecording: () => void;

  /**
   * Check if a specific submission's timer has been completed
   * @param submissionId - Submission ID to check
   * @returns True if timer has been completed for this submission
   */
  isTimerCompleted: (submissionId: string) => boolean;

  /**
   * Check if a specific submission's completed timer is stale (older than 3 days)
   * @param submissionId - Submission ID to check
   * @returns True if timer is stale or doesn't exist
   */
  isTimerStale: (submissionId: string) => boolean;

  /**
   * Clear a completed timer entry (call after review is submitted)
   * @param submissionId - Submission ID to clear
   */
  clearCompletedTimer: (submissionId: string) => void;

  /**
   * Override the active timer (admin only)
   * Marks the timer as complete immediately without waiting for the full duration
   */
  overrideTimer: () => void;
}

export function useReviewTimer(): UseReviewTimerReturn {
  // Load initial state from localStorage
  const [timerState, setTimerState] = useState<ReviewTimerState | null>(() =>
    loadTimerState()
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [pendingRequest, setPendingRequest] = useState<PendingTimerRequest | null>(null);
  const [completedTimersVersion, setCompletedTimersVersion] = useState(0);

  // Load completed timers (reactive to version changes for refresh after mutations)
  const completedTimers = useMemo(() => {
    // This dependency triggers reload when timers are added/removed
    void completedTimersVersion;
    return loadCompletedTimers();
  }, [completedTimersVersion]);

  // Calculate remaining time based on start time and duration
  const calculateRemaining = useCallback((state: ReviewTimerState): number => {
    const elapsed = (Date.now() - state.startTime) / 1000; // Convert to seconds
    const remaining = Math.max(0, state.duration - elapsed);
    return Math.floor(remaining);
  }, []);

  // Internal function to actually start a timer
  const doStartTimer = useCallback(
    (submissionId: string, submissionTitle: string, artistName: string, coverArtUrl: string | null, recordingUrl: string): boolean => {
      try {
        // Open recording in new tab
        window.open(recordingUrl, '_blank', 'noopener,noreferrer');

        // Create new timer state
        const newState: ReviewTimerState = {
          submissionId,
          submissionTitle,
          artistName,
          coverArtUrl,
          recordingUrl,
          startTime: Date.now(),
          duration: TIMER_DURATION_SECONDS,
          isActive: true,
        };

        // Save to state and localStorage
        setTimerState(newState);
        saveTimerState(newState);

        toast.success('Timer started', {
          description: 'Listen for at least 20 minutes before reviewing.',
        });

        logger.info('Review timer started', {
          submissionId,
          source: 'useReviewTimer.startTimer',
        });

        return true;
      } catch (error) {
        logger.error('Failed to start timer', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'useReviewTimer.startTimer',
          submissionId,
        });
        toast.error('Failed to start timer', {
          description: 'Please try again.',
        });
        return false;
      }
    },
    []
  );

  // Request to start a timer - handles confirmation flow
  const requestTimer = useCallback(
    (submissionId: string, submissionTitle: string, artistName: string, coverArtUrl: string | null, recordingUrl: string): 'started' | 'pending' | 'completed' | 'failed' => {
      // Check if already completed
      if (isSubmissionTimerCompleted(submissionId)) {
        toast.info('Timer already completed for this submission');
        return 'completed';
      }

      // If timer already active for a different submission, queue for confirmation
      if (timerState?.isActive && timerState.submissionId !== submissionId) {
        setPendingRequest({ submissionId, submissionTitle, artistName, coverArtUrl, recordingUrl });
        return 'pending';
      }

      // If timer already active for the same submission, just relaunch the recording
      if (timerState?.isActive && timerState.submissionId === submissionId) {
        window.open(recordingUrl, '_blank', 'noopener,noreferrer');
        toast.info('Recording opened', { description: 'Timer continues running.' });
        return 'started';
      }

      // Start immediately
      const success = doStartTimer(submissionId, submissionTitle, artistName, coverArtUrl, recordingUrl);
      return success ? 'started' : 'failed';
    },
    [timerState, doStartTimer]
  );

  // Confirm pending timer switch
  const confirmPendingTimer = useCallback(() => {
    if (!pendingRequest) return;

    // Clear current timer state (don't mark as completed)
    setTimerState(null);
    setRemainingSeconds(0);
    clearTimerState();

    // Start the pending timer
    doStartTimer(
      pendingRequest.submissionId,
      pendingRequest.submissionTitle,
      pendingRequest.artistName,
      pendingRequest.coverArtUrl,
      pendingRequest.recordingUrl
    );
    setPendingRequest(null);
  }, [pendingRequest, doStartTimer]);

  // Cancel pending request
  const cancelPendingRequest = useCallback(() => {
    setPendingRequest(null);
  }, []);

  // Cancel the active timer
  const cancelTimer = useCallback(() => {
    if (!timerState) return;

    logger.info('Review timer cancelled', {
      submissionId: timerState.submissionId,
      source: 'useReviewTimer.cancelTimer',
    });

    setTimerState(null);
    setRemainingSeconds(0);
    clearTimerState();

    toast.info('Timer cancelled', {
      description: 'You can start a new timer now.',
    });
  }, [timerState]);

  // Relaunch the recording URL
  const relaunchRecording = useCallback(() => {
    if (!timerState?.recordingUrl) {
      toast.error('No recording URL available');
      return;
    }
    window.open(timerState.recordingUrl, '_blank', 'noopener,noreferrer');
  }, [timerState]);

  // Complete the active timer
  const completeTimer = useCallback(() => {
    if (!timerState) return;

    logger.info('Review timer completed', {
      submissionId: timerState.submissionId,
      source: 'useReviewTimer.completeTimer',
    });

    // Mark as completed with full details for toolbar display
    markTimerCompletedWithDetails(
      timerState.submissionId,
      timerState.submissionTitle,
      timerState.artistName,
      timerState.coverArtUrl,
      timerState.recordingUrl
    );

    // Clear active timer
    setTimerState(null);
    setRemainingSeconds(0);
    clearTimerState();

    // Trigger refresh of completed timers list
    setCompletedTimersVersion(v => v + 1);

    toast.success('Timer completed', {
      description: 'You can now submit your review.',
    });
  }, [timerState]);

  // Check if submission timer is completed
  const isTimerCompleted = useCallback((submissionId: string): boolean => {
    return isSubmissionTimerCompleted(submissionId);
  }, []);

  // Check if a submission's completed timer is stale
  const isTimerStale = useCallback((submissionId: string): boolean => {
    return isSubmissionTimerStale(submissionId);
  }, []);

  // Clear a completed timer entry (after review is submitted)
  const clearCompletedTimer = useCallback((submissionId: string): void => {
    removeCompletedTimer(submissionId);
    setCompletedTimersVersion(v => v + 1);
    logger.info('Completed timer cleared', {
      submissionId,
      source: 'useReviewTimer.clearCompletedTimer',
    });
  }, []);

  // Override the active timer (admin only) - marks as complete immediately
  const overrideTimer = useCallback(() => {
    if (!timerState) return;

    logger.info('Review timer overridden by admin', {
      submissionId: timerState.submissionId,
      remainingSeconds,
      source: 'useReviewTimer.overrideTimer',
    });

    // Mark as completed with full details
    markTimerCompletedWithDetails(
      timerState.submissionId,
      timerState.submissionTitle,
      timerState.artistName,
      timerState.coverArtUrl,
      timerState.recordingUrl
    );

    // Clear active timer
    setTimerState(null);
    setRemainingSeconds(0);
    clearTimerState();

    // Trigger refresh of completed timers list
    setCompletedTimersVersion(v => v + 1);

    toast.success('Timer overridden', {
      description: 'You can now submit your review.',
    });
  }, [timerState, remainingSeconds]);

  // Ticker effect - runs every second when timer is active
  useEffect(() => {
    if (!timerState?.isActive) {
      setRemainingSeconds(0);
      return;
    }

    // Calculate initial remaining time
    const remaining = calculateRemaining(timerState);
    setRemainingSeconds(remaining);

    // If already completed, auto-complete
    if (remaining === 0) {
      completeTimer();
      return;
    }

    // Set up interval to tick every second
    const intervalId = setInterval(() => {
      const newRemaining = calculateRemaining(timerState);
      setRemainingSeconds(newRemaining);

      // Auto-complete when timer reaches 0
      if (newRemaining === 0) {
        completeTimer();
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [timerState, calculateRemaining, completeTimer]);

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newState = loadTimerState();
        setTimerState(newState);
      }
      if (e.key === COMPLETED_KEY) {
        // Trigger refresh of completed timers list
        setCompletedTimersVersion(v => v + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    timerState,
    remainingSeconds,
    isTimerActive: timerState?.isActive ?? false,
    pendingRequest,
    completedTimers,
    requestTimer,
    confirmPendingTimer,
    cancelPendingRequest,
    cancelTimer,
    completeTimer,
    relaunchRecording,
    isTimerCompleted,
    isTimerStale,
    clearCompletedTimer,
    overrideTimer,
  };
}
