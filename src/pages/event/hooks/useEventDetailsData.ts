import { useMemo } from 'react';
import { formatTimeDisplay } from '@/shared';
import type { EventDetailsRecord } from '../types';

export function useEventDetailsData(event: EventDetailsRecord) {
  const eventDate = useMemo(() => new Date(event.date), [event.date]);

  // Check if the event is in the past (date is before today at midnight)
  const isPastEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);
    return eventDay < today;
  }, [eventDate]);

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

  // Format time as: 9pm - 2am (just the time, no timezone)
  // For after hours events: 9pm - Late
  const formattedDateTime = useMemo(() => {
    // Parse start time (e.g., "9:00 PM")
    const startMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startMatch) return '';

    const startHour = parseInt(startMatch[1], 10);
    const startMeridiem = (startMatch[3] || 'PM').toUpperCase();

    // If after hours, show "9pm - Late"
    if (event.isAfterHours) {
      return `${startHour}${startMeridiem.toLowerCase()} - Late`;
    }

    // If no end time, just show start time
    if (!event.endTime) {
      return `${startHour}${startMeridiem.toLowerCase()}`;
    }

    // Parse end time (e.g., "2:00 AM")
    const endMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!endMatch) {
      return `${startHour}${startMeridiem.toLowerCase()}`;
    }

    const endHour = parseInt(endMatch[1], 10);
    const endMeridiem = (endMatch[3] || 'AM').toUpperCase();

    // Only show first meridiem if different from second
    const startMeridiemDisplay =
      startMeridiem !== endMeridiem ? startMeridiem.toLowerCase() : '';
    const endMeridiemDisplay = endMeridiem.toLowerCase();

    return `${startHour}${startMeridiemDisplay} - ${endHour}${endMeridiemDisplay}`;
  }, [event.time, event.endTime, event.isAfterHours]);

  const callTimeLineup = useMemo(() => {
    // Build lineup with headliner first (descending order - headliner at top)
    // Skip headliner if noHeadliner is true (don't show TBA placeholder)
    const lineup = event.noHeadliner
      ? [...event.undercard].filter(Boolean)
      : [event.headliner, ...event.undercard].filter(Boolean);
    if (lineup.length === 0) {
      return [];
    }

    // Check if any artist has a set_time - only show times if Set Scheduling is enabled
    const hasRealSchedule = lineup.some(artist => artist.setTime);

    if (hasRealSchedule) {
      // Use actual set times from the database, sorted by set time descending (latest first)
      const lineupWithTimes = lineup.map((artist, index) => {
        let callTimeLabel = '';

        if (artist.setTime) {
          const setDate = new Date(artist.setTime);
          callTimeLabel = formatTimeDisplay(
            setDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })
          );
        }

        // Only assign Headliner label if this is NOT a noHeadliner event
        const isHeadlinerSlot = !event.noHeadliner && index === 0;

        return {
          ...artist,
          callTime: callTimeLabel,
          roleLabel: isHeadlinerSlot ? 'Headliner' : undefined,
          _setTime: artist.setTime ? new Date(artist.setTime).getTime() : 0,
        };
      });

      // Sort by set time descending (latest/headliner first)
      return lineupWithTimes
        .sort((a, b) => b._setTime - a._setTime)
        .map(({ _setTime: _, ...artist }) => artist);
    }

    // No schedule data - show artists without times
    // Only assign Headliner label if this is NOT a noHeadliner event
    return lineup.map((artist, index) => ({
      ...artist,
      callTime: '',
      roleLabel: !event.noHeadliner && index === 0 ? 'Headliner' : undefined,
    }));
  }, [event.headliner, event.undercard, event.noHeadliner]);

  return {
    eventDate,
    isPastEvent,
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
