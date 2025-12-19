import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { cn } from '@/shared';
/**
 * FmEventRow - Reusable horizontal event card component
 *
 * Features:
 * - EventCard-inspired styling in horizontal layout
 * - Hero image on left with hover scale effect
 * - Event details in center with line details for stats
 * - Date box on right side
 * - Hover effects with gold border and shadow
 * - Click handler for navigation
 */
export function FmEventRow({ id, title, artistName, heroImage, startTime, venueName, className, onClick, }) {
    const navigate = useNavigate();
    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        return {
            weekday: date
                .toLocaleDateString('en-US', { weekday: 'short' })
                .toUpperCase(),
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate().toString(),
            year: date.getFullYear().toString(),
            fullDate: date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }),
        };
    };
    const handleClick = () => {
        if (onClick) {
            onClick(id);
        }
        else {
            navigate(`/event/${id}`);
        }
    };
    const dateObj = formatEventDate(startTime);
    return (_jsx("div", { className: cn('group relative overflow-hidden rounded-none border border-border bg-card', 'transition-all duration-300 cursor-pointer', 'hover:border-fm-gold/50 hover:shadow-lg hover:shadow-fm-gold/10', className), onClick: handleClick, children: _jsxs("div", { className: 'flex gap-0', children: [heroImage && (_jsxs("div", { className: 'relative w-48 h-48 overflow-hidden bg-muted flex-shrink-0', children: [_jsx(ImageWithSkeleton, { src: heroImage, alt: title, className: cn('h-full w-full object-cover transition-all duration-500', 'group-hover:scale-105'), skeletonClassName: 'rounded-none' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-r from-transparent to-background/20' })] })), _jsxs("div", { className: 'flex-1 p-6 flex flex-col justify-center min-w-0', children: [_jsx("h3", { className: 'font-canela text-2xl font-medium text-foreground mb-2 line-clamp-1', children: title }), artistName && (_jsx("p", { className: 'text-lg text-muted-foreground mb-3', children: artistName })), _jsxs("div", { className: 'space-y-2', children: [venueName && (_jsxs("div", { className: 'flex items-center gap-2 text-sm text-muted-foreground', children: [_jsx(MapPin, { className: 'w-4 h-4 text-fm-gold flex-shrink-0' }), _jsx("span", { className: 'truncate', children: venueName })] })), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-muted-foreground', children: [_jsx(Clock, { className: 'w-4 h-4 text-fm-gold flex-shrink-0' }), _jsxs("span", { children: [dateObj.fullDate, " at ", dateObj.time] })] })] })] }), _jsx("div", { className: 'border-l border-border bg-black/30 backdrop-blur-sm p-6 flex flex-col items-center justify-center min-w-[120px]', children: _jsx(FmDateBox, { weekday: dateObj.weekday, month: dateObj.month, day: dateObj.day, year: parseInt(dateObj.year, 10), size: 'md', className: 'border-none shadow-none bg-transparent backdrop-blur-none' }) })] }) }));
}
