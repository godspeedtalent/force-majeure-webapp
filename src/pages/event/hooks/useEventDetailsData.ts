import { useMemo } from 'react';
import { formatTimeDisplay } from '@/shared';
import type { EventDetailsRecord } from '../types';
import { CALL_TIME_INTERVAL_MINUTES } from '../components/constants';

export function useEventDetailsData(event: EventDetailsRecord) {
  const eventDate = useMemo(() => new Date(event.date), [event.date]);

  const longDateLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [eventDate]
  );

  const compactDateLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [eventDate]
  );

  const formattedTime = useMemo(
    () => formatTimeDisplay(event.time),
    [event.time]
  );

  // Use the isAfterHours flag from event data
  const isAfterHours = event.isAfterHours;

  const weekdayLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    [eventDate]
  );

  const monthLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    [eventDate]
  );

  const dayNumber = useMemo(() => eventDate.getDate().toString(), [eventDate]);

  const yearNumber = useMemo(() => eventDate.getFullYear(), [eventDate]);

  // Format time as: 9pm - 2am PST (just the time, no date)
  const formattedDateTime = useMemo(() => {
    // Get timezone
    const timezone = new Date()
      .toLocaleTimeString('en-US', { timeZoneName: 'short' })
      .split(' ')[2];

    // Parse start time (e.g., "9:00 PM")
    const startMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startMatch) return '';

    const startHour = parseInt(startMatch[1], 10);
    const startMeridiem = (startMatch[3] || 'PM').toUpperCase();

    // If after hours, just show start time
    if (event.isAfterHours) {
      return `${startHour}${startMeridiem.toLowerCase()} ${timezone}`;
    }

    // If no end time, just show start time
    if (!event.endTime) {
      return `${startHour}${startMeridiem.toLowerCase()} ${timezone}`;
    }

    // Parse end time (e.g., "2:00 AM")
    const endMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!endMatch) {
      return `${startHour}${startMeridiem.toLowerCase()} ${timezone}`;
    }

    const endHour = parseInt(endMatch[1], 10);
    const endMeridiem = (endMatch[3] || 'AM').toUpperCase();

    // Only show first meridiem if different from second
    const startMeridiemDisplay =
      startMeridiem !== endMeridiem ? startMeridiem.toLowerCase() : '';
    const endMeridiemDisplay = endMeridiem.toLowerCase();

    return `${startHour}${startMeridiemDisplay} - ${endHour}${endMeridiemDisplay} ${timezone}`;
  }, [event.time, event.endTime, event.isAfterHours]);

  const callTimeLineup = useMemo(() => {
    // Build lineup with headliner first (descending order - headliner at top)
    const lineup = [event.headliner, ...event.undercard].filter(Boolean);
    if (lineup.length === 0) {
      return [];
    }

    // Check if any artist has a set_time - if so, use real schedule data
    const hasRealSchedule = lineup.some(artist => artist.setTime);

    if (hasRealSchedule) {
      // Use actual set times from the database, sorted by set time descending (latest first)
      const lineupWithTimes = lineup.map((artist, index) => {
        let callTimeLabel = 'TBD';

        if (artist.setTime) {
          const setDate = new Date(artist.setTime);
          callTimeLabel = formatTimeDisplay(
            setDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })
          );
        }

        return {
          ...artist,
          callTime: callTimeLabel,
          roleLabel: index === 0 ? 'Headliner' : undefined,
          _setTime: artist.setTime ? new Date(artist.setTime).getTime() : 0,
        };
      });

      // Sort by set time descending (latest/headliner first)
      return lineupWithTimes
        .sort((a, b) => b._setTime - a._setTime)
        .map(({ _setTime: _, ...artist }) => artist);
    }

    // Fallback: Calculate estimated times based on event start/end time
    const startTimeMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startTimeMatch) {
      // No valid start time - show TBD for all artists
      return lineup.map((artist, index) => ({
        ...artist,
        callTime: 'TBD',
        roleLabel: index === 0 ? 'Headliner' : undefined,
      }));
    }

    // Build start date
    let startHour = parseInt(startTimeMatch[1], 10);
    const startMinutes = parseInt(startTimeMatch[2], 10);
    const startMeridiem = (startTimeMatch[3] || 'PM').toUpperCase();

    if (startMeridiem === 'PM' && startHour !== 12) startHour += 12;
    if (startMeridiem === 'AM' && startHour === 12) startHour = 0;

    const baseDate = new Date(event.date);
    baseDate.setHours(startHour, startMinutes, 0, 0);

    // Calculate interval based on end time if available, otherwise use default
    let intervalMinutes = CALL_TIME_INTERVAL_MINUTES;

    if (event.endTime && !event.isAfterHours) {
      const endTimeMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (endTimeMatch) {
        let endHour = parseInt(endTimeMatch[1], 10);
        const endMinutes = parseInt(endTimeMatch[2], 10);
        const endMeridiem = (endTimeMatch[3] || 'AM').toUpperCase();

        if (endMeridiem === 'PM' && endHour !== 12) endHour += 12;
        if (endMeridiem === 'AM' && endHour === 12) endHour = 0;

        const endDate = new Date(event.date);
        endDate.setHours(endHour, endMinutes, 0, 0);

        // If end time is before start time, it's the next day
        if (endDate <= baseDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        // Calculate total duration and divide by number of artists
        const totalDurationMinutes =
          (endDate.getTime() - baseDate.getTime()) / 60000;
        if (lineup.length > 1 && totalDurationMinutes > 0) {
          intervalMinutes = Math.floor(totalDurationMinutes / lineup.length);
        }
      }
    }

    // Calculate times in ascending order (first opener to headliner)
    // then reverse for display (headliner at top)
    const lineupWithTimes = lineup.map((artist, index) => {
      // Headliner plays last, so calculate from end
      const slotIndex = lineup.length - 1 - index;
      const callDate = new Date(
        baseDate.getTime() + slotIndex * intervalMinutes * 60_000
      );

      const callTimeLabel = formatTimeDisplay(
        callDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      );

      return {
        ...artist,
        callTime: callTimeLabel,
        roleLabel: index === 0 ? 'Headliner' : undefined,
      };
    });

    return lineupWithTimes;
  }, [
    event.date,
    event.time,
    event.endTime,
    event.isAfterHours,
    event.headliner,
    event.undercard,
  ]);

  return {
    eventDate,
    longDateLabel,
    compactDateLabel,
    formattedTime,
    formattedDateTime,
    isAfterHours,
    weekdayLabel,
    monthLabel,
    dayNumber,
    yearNumber,
    callTimeLineup,
  };
}
