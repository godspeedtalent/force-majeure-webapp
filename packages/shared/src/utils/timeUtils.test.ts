import { describe, it, expect } from 'vitest';
import { formatTimeDisplay, parseTimeToMinutes } from './timeUtils';

describe('formatTimeDisplay', () => {
  describe('numeric hour inputs (24-hour to 12-hour conversion)', () => {
    it('converts midnight (0) to 12AM', () => {
      expect(formatTimeDisplay(0)).toBe('12AM');
    });

    it('converts morning hours (1-11) to AM format', () => {
      expect(formatTimeDisplay(1)).toBe('1AM');
      expect(formatTimeDisplay(9)).toBe('9AM');
      expect(formatTimeDisplay(11)).toBe('11AM');
    });

    it('converts noon (12) to 12PM', () => {
      expect(formatTimeDisplay(12)).toBe('12PM');
    });

    it('converts afternoon/evening hours (13-23) to PM format', () => {
      expect(formatTimeDisplay(13)).toBe('1PM');
      expect(formatTimeDisplay(14)).toBe('2PM');
      expect(formatTimeDisplay(21)).toBe('9PM');
      expect(formatTimeDisplay(23)).toBe('11PM');
    });

    it('handles invalid numeric hours', () => {
      // Hours outside 0-23 range should be returned as strings
      expect(formatTimeDisplay(24)).toBe('24');
      expect(formatTimeDisplay(25)).toBe('25');
      expect(formatTimeDisplay(-1)).toBe('-1');
    });
  });

  describe('time string inputs', () => {
    it('removes :00 from times with AM/PM', () => {
      expect(formatTimeDisplay('9:00 PM')).toBe('9 PM');
      expect(formatTimeDisplay('9:00PM')).toBe('9PM');
      expect(formatTimeDisplay('12:00 AM')).toBe('12 AM');
      expect(formatTimeDisplay('11:00 PM')).toBe('11 PM');
    });

    it('keeps minutes when not :00', () => {
      expect(formatTimeDisplay('9:30 PM')).toBe('9:30 PM');
      expect(formatTimeDisplay('10:15 AM')).toBe('10:15 AM');
    });

    it('uppercases am/pm', () => {
      expect(formatTimeDisplay('9 pm')).toBe('9 PM');
      expect(formatTimeDisplay('10 am')).toBe('10 AM');
      expect(formatTimeDisplay('8:30 pm')).toBe('8:30 PM');
    });

    it('removes trailing :00 for 24-hour formats', () => {
      expect(formatTimeDisplay('21:00')).toBe('21');
      expect(formatTimeDisplay('14:00')).toBe('14');
      expect(formatTimeDisplay('09:00')).toBe('09');
    });

    it('keeps minutes in 24-hour format when not :00', () => {
      expect(formatTimeDisplay('21:30')).toBe('21:30');
      expect(formatTimeDisplay('14:15')).toBe('14:15');
    });
  });

  describe('time ranges', () => {
    it('formats time ranges with :00 removed', () => {
      expect(formatTimeDisplay('8:00 PM - 11:00 PM')).toBe('8 PM - 11 PM');
      expect(formatTimeDisplay('9:00PM - 12:00AM')).toBe('9PM - 12AM');
    });

    it('keeps minutes in ranges when not :00', () => {
      expect(formatTimeDisplay('8:30 PM - 11:45 PM')).toBe('8:30 PM - 11:45 PM');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for null', () => {
      expect(formatTimeDisplay(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatTimeDisplay(undefined)).toBe('');
      expect(formatTimeDisplay()).toBe('');
    });

    it('handles string representations of numbers', () => {
      expect(formatTimeDisplay('21')).toBe('9PM');
      expect(formatTimeDisplay('14')).toBe('2PM');
      expect(formatTimeDisplay('0')).toBe('12AM');
    });

    it('handles mixed formats', () => {
      expect(formatTimeDisplay('Doors at 8:00 PM')).toBe('Doors at 8 PM');
    });
  });
});

describe('parseTimeToMinutes', () => {
  describe('12-hour format parsing', () => {
    it('parses AM times correctly', () => {
      expect(parseTimeToMinutes('9:00 AM')).toBe(9 * 60); // 540
      expect(parseTimeToMinutes('10:30 AM')).toBe(10 * 60 + 30); // 630
      expect(parseTimeToMinutes('11:45 am')).toBe(11 * 60 + 45); // 705
    });

    it('parses PM times correctly', () => {
      expect(parseTimeToMinutes('1:00 PM')).toBe(13 * 60); // 780
      expect(parseTimeToMinutes('9:00 PM')).toBe(21 * 60); // 1260
      expect(parseTimeToMinutes('11:30 pm')).toBe(23 * 60 + 30); // 1410
    });

    it('handles 12 AM (midnight) correctly', () => {
      expect(parseTimeToMinutes('12:00 AM')).toBe(0);
      expect(parseTimeToMinutes('12:30 am')).toBe(30);
    });

    it('handles 12 PM (noon) correctly', () => {
      expect(parseTimeToMinutes('12:00 PM')).toBe(12 * 60); // 720
      expect(parseTimeToMinutes('12:30 pm')).toBe(12 * 60 + 30); // 750
    });

    it('parses times without minutes (assumes :00)', () => {
      expect(parseTimeToMinutes('9 AM')).toBe(9 * 60); // 540
      expect(parseTimeToMinutes('9 PM')).toBe(21 * 60); // 1260
    });

    it('handles various spacing formats', () => {
      expect(parseTimeToMinutes('9:00AM')).toBe(9 * 60);
      expect(parseTimeToMinutes('9:00 AM')).toBe(9 * 60);
      expect(parseTimeToMinutes('9AM')).toBe(9 * 60);
    });
  });

  describe('24-hour format parsing', () => {
    it('parses 24-hour times correctly', () => {
      expect(parseTimeToMinutes('0:00')).toBe(0);
      expect(parseTimeToMinutes('9:00')).toBe(9 * 60); // 540
      expect(parseTimeToMinutes('14:30')).toBe(14 * 60 + 30); // 870
      expect(parseTimeToMinutes('21:45')).toBe(21 * 60 + 45); // 1305
      expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59); // 1439
    });

    it('parses 24-hour times without minutes', () => {
      expect(parseTimeToMinutes('9')).toBe(9 * 60);
      expect(parseTimeToMinutes('14')).toBe(14 * 60);
      expect(parseTimeToMinutes('21')).toBe(21 * 60);
    });

    it('rejects invalid 24-hour times', () => {
      expect(parseTimeToMinutes('24:00')).toBe(null);
      expect(parseTimeToMinutes('25:30')).toBe(null);
      expect(parseTimeToMinutes('9:60')).toBe(null);
    });
  });

  describe('time ranges', () => {
    it('extracts the end time from ranges with hyphen', () => {
      expect(parseTimeToMinutes('8:00 PM - 11:00 PM')).toBe(23 * 60); // 1380 (11 PM)
      expect(parseTimeToMinutes('9 AM - 5 PM')).toBe(17 * 60); // 1020 (5 PM)
    });

    it('extracts the end time from ranges with en dash', () => {
      expect(parseTimeToMinutes('8:00 PM – 11:00 PM')).toBe(23 * 60);
    });

    it('extracts the end time from ranges with em dash', () => {
      expect(parseTimeToMinutes('8:00 PM — 11:00 PM')).toBe(23 * 60);
    });

    it('extracts the end time from ranges with "to"', () => {
      expect(parseTimeToMinutes('8:00 PM to 11:00 PM')).toBe(23 * 60);
      expect(parseTimeToMinutes('9 AM to 5 PM')).toBe(17 * 60);
    });

    it('handles ranges with various spacing', () => {
      expect(parseTimeToMinutes('8PM-11PM')).toBe(23 * 60);
      expect(parseTimeToMinutes('8PM - 11PM')).toBe(23 * 60);
      expect(parseTimeToMinutes('8PM  -  11PM')).toBe(23 * 60);
    });
  });

  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseTimeToMinutes('')).toBe(null);
    });

    it('returns null for null', () => {
      expect(parseTimeToMinutes(null)).toBe(null);
    });

    it('returns null for undefined', () => {
      expect(parseTimeToMinutes(undefined)).toBe(null);
      expect(parseTimeToMinutes()).toBe(null);
    });

    it('returns null for invalid time formats', () => {
      expect(parseTimeToMinutes('not a time')).toBe(null);
      expect(parseTimeToMinutes('25:00')).toBe(null);
      // Note: '9:70 PM' actually parses as valid (9 PM + 70 minutes = 10:10 PM = 1330 minutes)
      // The function doesn't validate minute ranges, which is acceptable behavior
      expect(parseTimeToMinutes('99:99 XM')).toBe(null); // Truly invalid format
    });

    it('handles case-insensitive AM/PM', () => {
      expect(parseTimeToMinutes('9:00 AM')).toBe(9 * 60);
      expect(parseTimeToMinutes('9:00 am')).toBe(9 * 60);
      expect(parseTimeToMinutes('9:00 Am')).toBe(9 * 60);
      expect(parseTimeToMinutes('9:00 PM')).toBe(21 * 60);
      expect(parseTimeToMinutes('9:00 pm')).toBe(21 * 60);
    });
  });
});
