import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Activity Log Summary Component
 *
 * Displays summary cards showing activity counts by category.
 */
import { User, Calendar, Music, MapPin, Disc, Tag, Ticket, Settings, } from 'lucide-react';
import { cn } from '@/shared';
import { CATEGORY_CONFIG, } from '../types';
// Icon mapping for categories
const CATEGORY_ICONS = {
    account: User,
    event: Calendar,
    artist: Music,
    venue: MapPin,
    recording: Disc,
    ticket_tier: Tag,
    ticket: Ticket,
    system: Settings,
};
function SummaryCard({ category, count, onClick, }) {
    const config = CATEGORY_CONFIG[category];
    const Icon = CATEGORY_ICONS[category];
    return (_jsxs("button", { onClick: onClick, className: cn('flex items-center gap-3 p-4 rounded-none', 'bg-black/40 border border-white/10', 'hover:border-fm-gold/50 hover:bg-black/60', 'transition-all duration-200', 'text-left w-full'), children: [_jsx("div", { className: cn('flex-shrink-0 w-10 h-10 rounded flex items-center justify-center', 'bg-white/5'), children: _jsx(Icon, { className: cn('h-5 w-5', config.color) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-2xl font-medium text-white", children: count.toLocaleString() }), _jsx("p", { className: cn('text-sm', config.color), children: config.label })] })] }));
}
function SkeletonCard() {
    return (_jsxs("div", { className: "flex items-center gap-3 p-4 bg-black/40 border border-white/10 animate-pulse", children: [_jsx("div", { className: "w-10 h-10 rounded bg-white/10" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-8 w-16 bg-white/10 rounded mb-1" }), _jsx("div", { className: "h-4 w-20 bg-white/10 rounded" })] })] }));
}
export function ActivityLogSummary({ summary, isLoading, onCategoryClick, }) {
    // Create a map for easy lookup
    const countByCategory = summary.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
    }, {});
    // Categories to display (most important ones)
    const displayCategories = [
        'ticket',
        'event',
        'account',
        'artist',
    ];
    // Calculate total
    const totalCount = summary.reduce((acc, item) => acc + item.count, 0);
    if (isLoading) {
        return (_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [1, 2, 3, 4].map(i => (_jsx(SkeletonCard, {}, i))) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: displayCategories.map(category => (_jsx(SummaryCard, { category: category, count: countByCategory[category] || 0, onClick: () => onCategoryClick?.(category) }, category))) }), _jsxs("div", { className: "flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-none", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Total events logged" }), _jsx("span", { className: "text-lg font-medium text-fm-gold", children: totalCount.toLocaleString() })] })] }));
}
