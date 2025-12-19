import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MapPin, Calendar, Clock } from 'lucide-react';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { cn } from '@/shared';
import { formatTimeDisplay, parseTimeToMinutes, } from '@/shared';
/**
 * FmTbaEventCard
 *
 * Placeholder event card for TBA (To Be Announced) events.
 * Features a skeleton-style design with animated shimmer effects while maintaining
 * the Force Majeure design system aesthetics.
 *
 * TBA events can optionally have:
 * - A date and time
 * - A venue
 *
 * Otherwise, they display placeholder text with skeleton shimmer styling.
 */
export const FmTbaEventCard = ({ event, isSingleRow = false, }) => {
    const formatDate = (dateString) => {
        if (!dateString)
            return null;
        const date = new Date(dateString);
        return {
            weekday: date
                .toLocaleDateString('en-US', { weekday: 'short' })
                .toUpperCase(),
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate().toString(),
            year: date.getFullYear().toString(),
        };
    };
    const formatFullDate = (dateString) => {
        if (!dateString)
            return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };
    const isAfterHours = (() => {
        if (!event.time)
            return false;
        const minutes = parseTimeToMinutes(event.time);
        return minutes !== null && minutes > 120;
    })();
    const dateObj = event.date ? formatDate(event.date) : null;
    return (_jsxs("div", { className: cn('group relative overflow-hidden rounded-none border border-border bg-card', 'transition-all duration-300', isSingleRow ? 'h-[50vh] w-auto' : 'aspect-[2/3]', 
        // Shimmer effect for TBA cards
        'before:absolute before:inset-0 before:z-10 before:bg-gradient-to-r', 'before:from-transparent before:via-white/5 before:to-transparent', 'before:animate-[shimmer_3s_ease-in-out_infinite]', 'hover:border-fm-gold/30 hover:shadow-lg hover:shadow-fm-gold/5'), style: isSingleRow ? { aspectRatio: '2/3' } : undefined, children: [_jsxs("div", { className: 'relative h-[65%] overflow-hidden bg-black/40', children: [_jsx("div", { className: 'absolute inset-0 opacity-20 bg-topography' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent' }), _jsx("div", { className: 'absolute bottom-0 left-0 right-0 p-[20px]', children: _jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h3", { className: 'font-canela text-2xl font-medium text-fm-gold/80', children: "To Be Announced" }), _jsx("p", { className: 'text-sm text-muted-foreground/60', children: "Details coming soon..." })] }) })] }), _jsxs("div", { className: 'relative h-[35%] flex', children: [_jsxs("div", { className: 'flex-1 p-[20px] pt-[20px] flex flex-col min-w-0', children: [_jsxs("div", { className: 'mb-[20px] space-y-[5px]', children: [_jsx("div", { className: 'h-3 w-3/4 bg-white/10 rounded-none animate-pulse' }), _jsx("div", { className: 'h-3 w-1/2 bg-white/10 rounded-none animate-pulse' })] }), _jsxs("div", { className: 'space-y-[10px] mb-[20px]', children: [event.date ? (_jsxs("div", { className: 'flex items-center gap-[10px] text-sm text-muted-foreground', children: [_jsx(Calendar, { className: 'w-4 h-4 text-fm-gold/60 flex-shrink-0' }), _jsx("span", { className: 'truncate', children: formatFullDate(event.date) })] })) : (_jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx(Calendar, { className: 'w-4 h-4 text-fm-gold/30 flex-shrink-0' }), _jsx("div", { className: 'h-3 w-32 bg-white/10 rounded-none animate-pulse' })] })), event.time ? (_jsxs("div", { className: 'flex items-center gap-[10px] text-sm text-muted-foreground', children: [_jsx(Clock, { className: 'w-4 h-4 text-fm-gold/60 flex-shrink-0' }), _jsx("span", { children: formatTimeDisplay(event.time) })] })) : (_jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx(Clock, { className: 'w-4 h-4 text-fm-gold/30 flex-shrink-0' }), _jsx("div", { className: 'h-3 w-20 bg-white/10 rounded-none animate-pulse' })] })), event.venue ? (_jsxs("div", { className: 'flex items-center gap-[10px] text-sm text-muted-foreground', children: [_jsx(MapPin, { className: 'w-4 h-4 text-fm-gold/60 flex-shrink-0' }), _jsx("span", { className: 'truncate', children: event.venue })] })) : (_jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx(MapPin, { className: 'w-4 h-4 text-fm-gold/30 flex-shrink-0' }), _jsx("div", { className: 'h-3 w-24 bg-white/10 rounded-none animate-pulse' })] }))] }), _jsx("div", { className: 'mt-auto', children: _jsx("div", { className: 'h-9 w-full bg-white/5 border border-white/10 rounded-none' }) })] }), dateObj ? (_jsx(FmDateBox, { weekday: dateObj.weekday, month: dateObj.month, day: dateObj.day, year: parseInt(dateObj.year, 10), size: 'md', isAfterHours: isAfterHours, className: 'border-l rounded-none opacity-60' })) : (_jsx("div", { className: 'w-[100px] border-l border-border bg-black/20 flex flex-col items-center justify-center p-[10px]', children: _jsxs("div", { className: 'space-y-[10px] w-full', children: [_jsx("div", { className: 'h-3 w-full bg-white/10 rounded-none animate-pulse' }), _jsx("div", { className: 'h-6 w-full bg-white/10 rounded-none animate-pulse' }), _jsx("div", { className: 'h-3 w-full bg-white/10 rounded-none animate-pulse' })] }) }))] })] }));
};
