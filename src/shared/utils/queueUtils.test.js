import { describe, it, expect } from 'vitest';
import { calculateEstimatedWaitTime, formatWaitTime, getQueueProgressPercentage, formatQueuePosition, shouldNotifyPositionChange, } from './queueUtils';
describe('calculateEstimatedWaitTime', () => {
    const maxConcurrent = 10;
    const avgSessionMinutes = 5;
    describe('when slots are available', () => {
        it('returns 0 wait time if user can enter immediately', () => {
            // 5 active users, 10 max = 5 available slots
            // Position 1-5 should get in immediately
            expect(calculateEstimatedWaitTime(1, 5, maxConcurrent, avgSessionMinutes)).toBe(0);
            expect(calculateEstimatedWaitTime(5, 5, maxConcurrent, avgSessionMinutes)).toBe(0);
        });
        it('calculates wait time for positions beyond available slots', () => {
            // 5 active, 10 max = 5 available slots
            // Position 6 needs to wait for 1 user (rounds up to 1 session)
            expect(calculateEstimatedWaitTime(6, 5, maxConcurrent, avgSessionMinutes)).toBe(5); // 1 group * 5 min
            // Position 10 needs to wait for 5 users (rounds up to 1 session)
            expect(calculateEstimatedWaitTime(10, 5, maxConcurrent, avgSessionMinutes)).toBe(5);
            // Position 11 needs to wait for 6 users (rounds up to 1 session)
            expect(calculateEstimatedWaitTime(11, 5, maxConcurrent, avgSessionMinutes)).toBe(5);
            // Position 16 needs to wait for 11 users (rounds up to 2 sessions)
            expect(calculateEstimatedWaitTime(16, 5, maxConcurrent, avgSessionMinutes)).toBe(10); // 2 groups * 5 min
        });
    });
    describe('when at max capacity', () => {
        it('calculates wait time based on full batches', () => {
            // 10 active, 10 max = 0 available slots
            // Position 1 waits for 1 session
            expect(calculateEstimatedWaitTime(1, 10, maxConcurrent, avgSessionMinutes)).toBe(5);
            // Position 10 waits for 1 session
            expect(calculateEstimatedWaitTime(10, 10, maxConcurrent, avgSessionMinutes)).toBe(5);
            // Position 11 waits for 2 sessions
            expect(calculateEstimatedWaitTime(11, 10, maxConcurrent, avgSessionMinutes)).toBe(10);
            // Position 20 waits for 2 sessions
            expect(calculateEstimatedWaitTime(20, 10, maxConcurrent, avgSessionMinutes)).toBe(10);
            // Position 21 waits for 3 sessions
            expect(calculateEstimatedWaitTime(21, 10, maxConcurrent, avgSessionMinutes)).toBe(15);
        });
    });
    describe('edge cases', () => {
        it('handles position 0 correctly', () => {
            expect(calculateEstimatedWaitTime(0, 5, maxConcurrent, avgSessionMinutes)).toBe(0);
        });
        it('handles no active users', () => {
            // 0 active, all slots available
            expect(calculateEstimatedWaitTime(1, 0, maxConcurrent, avgSessionMinutes)).toBe(0);
            expect(calculateEstimatedWaitTime(10, 0, maxConcurrent, avgSessionMinutes)).toBe(0);
            expect(calculateEstimatedWaitTime(11, 0, maxConcurrent, avgSessionMinutes)).toBe(5);
        });
        it('uses custom average session time', () => {
            expect(calculateEstimatedWaitTime(11, 10, maxConcurrent, 10)).toBe(20); // 2 groups * 10 min
            expect(calculateEstimatedWaitTime(21, 10, maxConcurrent, 3)).toBe(9); // 3 groups * 3 min
        });
    });
});
describe('formatWaitTime', () => {
    describe('less than 1 minute', () => {
        it('formats 0 minutes', () => {
            expect(formatWaitTime(0)).toBe('Less than 1 minute');
        });
    });
    describe('single minute', () => {
        it('formats 1 minute', () => {
            expect(formatWaitTime(1)).toBe('About 1 minute');
        });
    });
    describe('under 5 minutes', () => {
        it('rounds up and formats', () => {
            expect(formatWaitTime(2)).toBe('About 2 minutes');
            expect(formatWaitTime(3)).toBe('About 3 minutes');
            expect(formatWaitTime(4)).toBe('About 4 minutes');
            expect(formatWaitTime(4.2)).toBe('About 5 minutes'); // Ceiling
        });
    });
    describe('5 to 9 minutes', () => {
        it('rounds to nearest 5', () => {
            expect(formatWaitTime(5)).toBe('About 5 minutes');
            expect(formatWaitTime(6)).toBe('About 5 minutes');
            expect(formatWaitTime(7)).toBe('About 5 minutes');
            expect(formatWaitTime(8)).toBe('About 10 minutes');
            expect(formatWaitTime(9)).toBe('About 10 minutes');
        });
    });
    describe('10 to 59 minutes', () => {
        it('rounds to nearest 10', () => {
            expect(formatWaitTime(10)).toBe('About 10 minutes');
            expect(formatWaitTime(14)).toBe('About 10 minutes');
            expect(formatWaitTime(15)).toBe('About 20 minutes');
            expect(formatWaitTime(24)).toBe('About 20 minutes');
            expect(formatWaitTime(25)).toBe('About 30 minutes');
            expect(formatWaitTime(44)).toBe('About 40 minutes');
            expect(formatWaitTime(55)).toBe('About 60 minutes');
        });
    });
    describe('hours', () => {
        it('formats 1 hour exactly', () => {
            expect(formatWaitTime(60)).toBe('About 1 hour');
        });
        it('formats multiple hours exactly', () => {
            expect(formatWaitTime(120)).toBe('About 2 hours');
            expect(formatWaitTime(180)).toBe('About 3 hours');
        });
        it('formats hours with minutes', () => {
            expect(formatWaitTime(70)).toBe('About 1 hour and 10 minutes');
            expect(formatWaitTime(75)).toBe('About 1 hour and 20 minutes');
            expect(formatWaitTime(125)).toBe('About 2 hours and 10 minutes');
            expect(formatWaitTime(145)).toBe('About 2 hours and 30 minutes');
        });
        it('rounds minutes to nearest 10 when combined with hours', () => {
            expect(formatWaitTime(64)).toBe('About 1 hour'); // 4 min rounds to 0
            expect(formatWaitTime(65)).toBe('About 1 hour and 10 minutes'); // 5 min rounds to 10
            expect(formatWaitTime(74)).toBe('About 1 hour and 10 minutes'); // 14 min rounds to 10
            expect(formatWaitTime(75)).toBe('About 1 hour and 20 minutes'); // 15 min rounds to 20
        });
    });
});
describe('getQueueProgressPercentage', () => {
    it('returns 100% when position is 0', () => {
        expect(getQueueProgressPercentage(0, 10)).toBe(100);
    });
    it('returns 100% when total is 0', () => {
        expect(getQueueProgressPercentage(5, 0)).toBe(100);
    });
    it('calculates progress correctly (inverted: first = 100%)', () => {
        // Position 1 of 10 = 100% progress
        expect(getQueueProgressPercentage(1, 10)).toBe(100);
        // Position 5 of 10 = 60% progress
        expect(getQueueProgressPercentage(5, 10)).toBe(60);
        // Position 10 of 10 = 10% progress (last in line)
        expect(getQueueProgressPercentage(10, 10)).toBe(10);
    });
    it('handles edge cases', () => {
        // Position 1 of 1 = 100%
        expect(getQueueProgressPercentage(1, 1)).toBe(100);
        // Position 2 of 2 = 50%
        expect(getQueueProgressPercentage(2, 2)).toBe(50);
    });
    it('clamps values between 0 and 100', () => {
        // Should not go below 0
        expect(getQueueProgressPercentage(100, 10)).toBeGreaterThanOrEqual(0);
        // Should not go above 100
        expect(getQueueProgressPercentage(0, 10)).toBeLessThanOrEqual(100);
    });
});
describe('formatQueuePosition', () => {
    describe('1st, 2nd, 3rd special cases', () => {
        it('formats 1st correctly', () => {
            expect(formatQueuePosition(1)).toBe('1st');
            expect(formatQueuePosition(21)).toBe('21st');
            expect(formatQueuePosition(31)).toBe('31st');
            expect(formatQueuePosition(101)).toBe('101st');
        });
        it('formats 2nd correctly', () => {
            expect(formatQueuePosition(2)).toBe('2nd');
            expect(formatQueuePosition(22)).toBe('22nd');
            expect(formatQueuePosition(32)).toBe('32nd');
            expect(formatQueuePosition(102)).toBe('102nd');
        });
        it('formats 3rd correctly', () => {
            expect(formatQueuePosition(3)).toBe('3rd');
            expect(formatQueuePosition(23)).toBe('23rd');
            expect(formatQueuePosition(33)).toBe('33rd');
            expect(formatQueuePosition(103)).toBe('103rd');
        });
    });
    describe('teen exceptions (11th, 12th, 13th)', () => {
        it('formats teens with "th"', () => {
            expect(formatQueuePosition(11)).toBe('11th');
            expect(formatQueuePosition(12)).toBe('12th');
            expect(formatQueuePosition(13)).toBe('13th');
            expect(formatQueuePosition(111)).toBe('111th');
            expect(formatQueuePosition(112)).toBe('112th');
            expect(formatQueuePosition(113)).toBe('113th');
        });
    });
    describe('all other positions', () => {
        it('formats with "th"', () => {
            expect(formatQueuePosition(4)).toBe('4th');
            expect(formatQueuePosition(5)).toBe('5th');
            expect(formatQueuePosition(10)).toBe('10th');
            expect(formatQueuePosition(20)).toBe('20th');
            expect(formatQueuePosition(100)).toBe('100th');
            expect(formatQueuePosition(1000)).toBe('1000th');
        });
    });
});
describe('shouldNotifyPositionChange', () => {
    describe('moving to active (position 0)', () => {
        it('always notifies when reaching position 0', () => {
            expect(shouldNotifyPositionChange(1, 0)).toBe(true);
            expect(shouldNotifyPositionChange(5, 0)).toBe(true);
            expect(shouldNotifyPositionChange(20, 0)).toBe(true);
        });
        it('notifies when already at position 0 (newPosition === 0 always returns true)', () => {
            // Per implementation line 129: newPosition === 0 returns true
            expect(shouldNotifyPositionChange(0, 0)).toBe(true);
        });
    });
    describe('front of queue (positions 1-10)', () => {
        it('notifies on every position change', () => {
            expect(shouldNotifyPositionChange(10, 9)).toBe(true);
            expect(shouldNotifyPositionChange(9, 8)).toBe(true);
            expect(shouldNotifyPositionChange(5, 4)).toBe(true);
            expect(shouldNotifyPositionChange(2, 1)).toBe(true);
        });
        it('does not notify when position unchanged', () => {
            expect(shouldNotifyPositionChange(5, 5)).toBe(false);
        });
    });
    describe('middle of queue (positions 11-20)', () => {
        it('notifies every 3 positions', () => {
            // Crossing 3-position boundaries
            expect(shouldNotifyPositionChange(20, 17)).toBe(true); // 20/3=6, 17/3=5
            expect(shouldNotifyPositionChange(17, 14)).toBe(true); // 17/3=5, 14/3=4
            expect(shouldNotifyPositionChange(14, 11)).toBe(true); // 14/3=4, 11/3=3
        });
        it('does not notify for changes within same 3-position group', () => {
            expect(shouldNotifyPositionChange(20, 19)).toBe(false); // Both in group 6 (20/3=6, 19/3=6)
            expect(shouldNotifyPositionChange(19, 18)).toBe(false); // Both in group 6 (19/3=6, 18/3=6)
            // 15/3=5, 13/3=4, so this DOES cross boundaries
            expect(shouldNotifyPositionChange(14, 13)).toBe(false); // Both in group 4 (14/3=4, 13/3=4)
        });
    });
    describe('back of queue (positions 21+)', () => {
        it('notifies every 5 positions', () => {
            // Crossing 5-position boundaries
            expect(shouldNotifyPositionChange(30, 25)).toBe(true); // 30/5=6, 25/5=5
            expect(shouldNotifyPositionChange(25, 20)).toBe(true); // 25/5=5, 20/5=4
            expect(shouldNotifyPositionChange(50, 45)).toBe(true); // 50/5=10, 45/5=9
        });
        it('does not notify for changes within same 5-position group', () => {
            // Group boundaries: 25-29 (group 5), 30-34 (group 6), etc.
            expect(shouldNotifyPositionChange(29, 28)).toBe(false); // Both in group 5 (29/5=5, 28/5=5)
            expect(shouldNotifyPositionChange(28, 27)).toBe(false); // Both in group 5 (28/5=5, 27/5=5)
            expect(shouldNotifyPositionChange(27, 26)).toBe(false); // Both in group 5 (27/5=5, 26/5=5)
            expect(shouldNotifyPositionChange(32, 31)).toBe(false); // Both in group 6 (32/5=6, 31/5=6)
        });
    });
    describe('transitioning between queue sections', () => {
        it('notifies when moving from back to middle', () => {
            expect(shouldNotifyPositionChange(21, 20)).toBe(true);
        });
        it('notifies when moving from middle to front', () => {
            expect(shouldNotifyPositionChange(11, 10)).toBe(true);
        });
        it('notifies when jumping sections', () => {
            expect(shouldNotifyPositionChange(25, 5)).toBe(true);
            expect(shouldNotifyPositionChange(15, 2)).toBe(true);
        });
    });
});
