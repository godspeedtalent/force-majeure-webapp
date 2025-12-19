import { jsx as _jsx } from "react/jsx-runtime";
import { formatDistanceToNow, format, isValid, parseISO } from 'date-fns';
/**
 * DateCell - Displays a formatted date in a data grid cell
 *
 * Formats:
 * - relative: "2 hours ago"
 * - short: "Nov 8, 2025"
 * - long: "November 8, 2025"
 * - datetime: "Nov 8, 2025 at 3:45 PM"
 */
export function DateCell({ value, format: formatType = 'short', emptyText = '—', }) {
    if (!value) {
        return _jsx("span", { className: 'text-muted-foreground text-sm', children: emptyText });
    }
    let date;
    try {
        date = typeof value === 'string' ? parseISO(value) : value;
        if (!isValid(date)) {
            throw new Error('Invalid date');
        }
    }
    catch {
        return (_jsx("span", { className: 'text-muted-foreground text-sm', children: "Invalid date" }));
    }
    let formattedDate;
    switch (formatType) {
        case 'relative':
            formattedDate = formatDistanceToNow(date, { addSuffix: true });
            break;
        case 'short':
            formattedDate = format(date, 'MMM d, yyyy');
            break;
        case 'long':
            formattedDate = format(date, 'MMMM d, yyyy');
            break;
        case 'datetime':
            formattedDate = format(date, "MMM d, yyyy 'at' h:mm a");
            break;
        default:
            formattedDate = format(date, 'MMM d, yyyy');
    }
    return _jsx("span", { className: 'text-sm whitespace-nowrap', children: formattedDate });
}
