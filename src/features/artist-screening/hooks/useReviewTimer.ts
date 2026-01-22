import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/shared';
import type { ReviewTimerState } from '../types';

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

// ============================================================================
// localStorage Utilities
// ============================================================================

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
// Completed Timers Tracking
// ============================================================================

const COMPLETED_KEY = 'fm_completed_review_timers';

/**
 * Load completed submission IDs from localStorage
 */
function loadCompletedTimers(): Set<string> {
  try {
    const stored = localStorage.getItem(COMPLETED_KEY);
    if (!stored) return new Set();
    const array = JSON.parse(stored) as string[];
    return new Set(array);
  } catch {
    return new Set();
  }
}

/**
 * Save completed submission IDs to localStorage
 */
function saveCompletedTimers(completed: Set<string>): void {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
  } catch (error) {
    logger.error('Failed to save completed timers', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'useReviewTimer.saveCompletedTimers',
    });
  }
}

/**
 * Mark submission timer as completed
 */
function markTimerCompleted(submissionId: string): void {
  const completed = loadCompletedTimers();
  completed.add(submissionId);
  saveCompletedTimers(completed);
}

/**
 * Check if submission timer is completed
 */
function isSubmissionTimerCompleted(submissionId: string): boolean {
  const completed = loadCompletedTimers();
  return completed.has(submissionId);
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
   * Start a new timer for a submission
   * Opens recording URL in new tab and starts countdown
   * @param submissionId - Submission ID
   * @param recordingUrl - URL to open in new tab
   * @returns Success boolean
   */
  startTimer: (submissionId: string, recordingUrl: string) => boolean;

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
   * Check if a specific submission's timer has been completed
   * @param submissionId - Submission ID to check
   * @returns True if timer has been completed for this submission
   */
  isTimerCompleted: (submissionId: string) => boolean;
}

export function useReviewTimer(): UseReviewTimerReturn {
  // Load initial state from localStorage
  const [timerState, setTimerState] = useState<ReviewTimerState | null>(() =>
    loadTimerState()
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Calculate remaining time based on start time and duration
  const calculateRemaining = useCallback((state: ReviewTimerState): number => {
    const elapsed = (Date.now() - state.startTime) / 1000; // Convert to seconds
    const remaining = Math.max(0, state.duration - elapsed);
    return Math.floor(remaining);
  }, []);

  // Start a new timer
  const startTimer = useCallback(
    (submissionId: string, recordingUrl: string): boolean => {
      // Block if timer already active
      if (timerState?.isActive) {
        toast.error('Timer already active', {
          description: 'Please cancel or complete the current timer first.',
        });
        return false;
      }

      // Check if already completed
      if (isSubmissionTimerCompleted(submissionId)) {
        toast.info('Timer already completed for this submission');
        return false;
      }

      try {
        // Open recording in new tab
        window.open(recordingUrl, '_blank', 'noopener,noreferrer');

        // Create new timer state
        const newState: ReviewTimerState = {
          submissionId,
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
    [timerState]
  );

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

  // Complete the active timer
  const completeTimer = useCallback(() => {
    if (!timerState) return;

    logger.info('Review timer completed', {
      submissionId: timerState.submissionId,
      source: 'useReviewTimer.completeTimer',
    });

    // Mark as completed
    markTimerCompleted(timerState.submissionId);

    // Clear active timer
    setTimerState(null);
    setRemainingSeconds(0);
    clearTimerState();

    toast.success('Timer completed', {
      description: 'You can now submit your review.',
    });
  }, [timerState]);

  // Check if submission timer is completed
  const isTimerCompleted = useCallback((submissionId: string): boolean => {
    return isSubmissionTimerCompleted(submissionId);
  }, []);

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
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    timerState,
    remainingSeconds,
    isTimerActive: timerState?.isActive ?? false,
    startTimer,
    cancelTimer,
    completeTimer,
    isTimerCompleted,
  };
}
