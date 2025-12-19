import { useMemo } from 'react';
import { ATTENDEE_PLACEHOLDERS } from '../components/constants';
export function useAttendeeList(ticketCount) {
    const attendeeList = useMemo(() => {
        const baseAttendees = [...ATTENDEE_PLACEHOLDERS];
        const limit = Math.min(Math.max(ticketCount, baseAttendees.length), 64);
        const extrasNeeded = Math.max(limit - baseAttendees.length, 0);
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const computeInitials = (value) => {
            const first = letters[Math.floor(value / letters.length) % letters.length] ?? 'A';
            const second = letters[value % letters.length] ?? 'A';
            return `${first}${second}`;
        };
        const generated = Array.from({ length: extrasNeeded }, (_unused, index) => ({
            name: `Guest ${index + 1}`,
            avatar: computeInitials(index),
        }));
        return baseAttendees.concat(generated);
    }, [ticketCount]);
    const attendeePreview = useMemo(() => attendeeList.slice(0, ATTENDEE_PLACEHOLDERS.length), [attendeeList]);
    return {
        attendeeList,
        attendeePreview,
    };
}
