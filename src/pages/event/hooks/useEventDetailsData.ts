import { useMemo } from 'react';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';
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

  const isAfterHours = useMemo(() => {
    if (!event.time) return false;
    const timeParts = event.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeParts) return false;

    let hours = parseInt(timeParts[1]);
    const meridiem = timeParts[3]?.toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    // After hours: 10 PM or later, or before 6 AM
    return hours >= 22 || hours < 6;
  }, [event.time]);

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

  const callTimeLineup = useMemo(() => {
    const lineup = [...event.undercard, event.headliner].filter(Boolean);
    if (lineup.length === 0) {
      return [];
    }

    const baseDate = new Date(`${event.date}T${event.time || '19:00'}`);
    const hasValidBase = !Number.isNaN(baseDate.getTime());

    return lineup.map((artist, index) => {
      const callDate =
        hasValidBase && index >= 0
          ? new Date(
              baseDate.getTime() + index * CALL_TIME_INTERVAL_MINUTES * 60_000
            )
          : null;

      const callTimeLabel =
        callDate !== null
          ? formatTimeDisplay(
              callDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            )
          : 'TBD';

      return {
        ...artist,
        callTime: callTimeLabel,
        roleLabel: index === lineup.length - 1 ? 'Headliner' : undefined,
      };
    });
  }, [event.date, event.time, event.headliner, event.undercard]);

  return {
    eventDate,
    longDateLabel,
    compactDateLabel,
    formattedTime,
    isAfterHours,
    weekdayLabel,
    monthLabel,
    dayNumber,
    yearNumber,
    callTimeLineup,
  };
}
