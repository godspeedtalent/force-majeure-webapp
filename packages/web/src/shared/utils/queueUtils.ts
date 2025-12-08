/**
 * Queue utilities for ticketing system.
 * Provides calculations for wait times, progress, and queue position.
 */

/**
 * Calculates estimated wait time in minutes for a user in queue.
 *
 * Algorithm:
 * - Determines how many "slots" are available for new users
 * - Calculates how many groups of users need to be processed before this user
 * - Estimates time based on average session duration
 *
 * @param queuePosition - User's current position in queue (1-based)
 * @param activeCount - Number of users currently active in ticketing
 * @param maxConcurrent - Maximum concurrent users allowed
 * @param avgSessionMinutes - Average time a user spends in ticketing (default: 5)
 * @returns Estimated wait time in minutes
 */
export function calculateEstimatedWaitTime(
  queuePosition: number,
  activeCount: number,
  maxConcurrent: number,
  avgSessionMinutes: number = 5
): number {
  // If already at max capacity, all waiting users must wait for current batch
  const availableSlots = Math.max(0, maxConcurrent - activeCount);

  if (availableSlots === 0) {
    // All slots full - wait for at least one session to complete
    const waitGroups = Math.ceil(queuePosition / maxConcurrent);
    return waitGroups * avgSessionMinutes;
  }

  // Some slots available - calculate when this user will get in
  if (queuePosition <= availableSlots) {
    // User will get in immediately when current batch processes
    return 0;
  }

  // User needs to wait for some current sessions to complete
  const usersAhead = queuePosition - availableSlots;
  const waitGroups = Math.ceil(usersAhead / maxConcurrent);
  return waitGroups * avgSessionMinutes;
}

/**
 * Formats wait time in minutes to user-friendly string.
 *
 * @param minutes - Wait time in minutes
 * @returns Formatted string (e.g., "About 5 minutes", "Less than 1 minute")
 */
export function formatWaitTime(minutes: number): string {
  if (minutes === 0) {
    return 'Less than 1 minute';
  }

  if (minutes === 1) {
    return 'About 1 minute';
  }

  if (minutes < 5) {
    return `About ${Math.ceil(minutes)} minutes`;
  }

  if (minutes < 10) {
    return `About ${Math.round(minutes / 5) * 5} minutes`;
  }

  if (minutes < 60) {
    return `About ${Math.round(minutes / 10) * 10} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round((minutes % 60) / 10) * 10;

  if (remainingMinutes === 0) {
    return hours === 1 ? 'About 1 hour' : `About ${hours} hours`;
  }

  return `About ${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minutes`;
}

/**
 * Calculates progress percentage for queue position.
 *
 * @param position - Current position in queue (1-based)
 * @param total - Total number in queue
 * @returns Percentage (0-100) representing how far through the queue
 */
export function getQueueProgressPercentage(
  position: number,
  total: number
): number {
  if (total === 0) return 100;
  if (position === 0) return 100;

  // Invert so that being first in line = 100% progress
  const progress = ((total - position + 1) / total) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Formats queue position to ordinal string.
 *
 * @param position - Queue position (1-based)
 * @returns Ordinal string (e.g., "1st", "2nd", "3rd", "21st")
 */
export function formatQueuePosition(position: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const value = position % 100;

  return position + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);
}

/**
 * Determines if user should receive a position update notification.
 * Only notify on significant position changes to avoid spam.
 *
 * @param oldPosition - Previous queue position
 * @param newPosition - New queue position
 * @returns True if notification should be shown
 */
export function shouldNotifyPositionChange(
  oldPosition: number,
  newPosition: number
): boolean {
  // Always notify when moving to active (position 0 or can access)
  if (newPosition === 0 || oldPosition > 0 && newPosition === 0) {
    return true;
  }

  // Notify every 5 positions when in back of queue (> 20)
  if (oldPosition > 20 && newPosition > 20) {
    return Math.floor(oldPosition / 5) !== Math.floor(newPosition / 5);
  }

  // Notify every 3 positions when in middle (10-20)
  if (oldPosition > 10 && newPosition > 10) {
    return Math.floor(oldPosition / 3) !== Math.floor(newPosition / 3);
  }

  // Always notify when in front of queue (< 10)
  return oldPosition !== newPosition;
}
