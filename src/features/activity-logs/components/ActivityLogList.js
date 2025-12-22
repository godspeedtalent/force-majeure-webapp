import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Activity Log List Component
 *
 * Displays activity logs with grouping and expand/collapse functionality.
 * Groups similar events (same type + resource) within 5-minute windows.
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { ChevronDown, ChevronRight, User, Calendar, Music, MapPin, Disc, Tag, Ticket, Settings, ExternalLink, } from 'lucide-react';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { CATEGORY_CONFIG, EVENT_TYPE_CONFIG, } from '../types';
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
/**
 * Group logs by type + resource within 5-minute windows
 */
function groupLogs(logs) {
    if (!logs.length)
        return [];
    const groups = [];
    const processedIds = new Set();
    for (const log of logs) {
        if (processedIds.has(log.id))
            continue;
        // Find all logs that can be grouped with this one
        const groupableRange = 5; // minutes
        const groupKey = `${log.event_type}-${log.target_resource_type}-${log.target_resource_id}`;
        const relatedLogs = logs.filter(other => {
            if (processedIds.has(other.id))
                return false;
            if (other.event_type !== log.event_type)
                return false;
            if (other.target_resource_type !== log.target_resource_type)
                return false;
            if (other.target_resource_id !== log.target_resource_id)
                return false;
            const timeDiff = Math.abs(differenceInMinutes(new Date(log.timestamp), new Date(other.timestamp)));
            return timeDiff <= groupableRange;
        });
        relatedLogs.forEach(l => processedIds.add(l.id));
        // Create aggregated description
        let aggregatedDescription = log.description;
        if (relatedLogs.length > 1) {
            const eventConfig = EVENT_TYPE_CONFIG[log.event_type];
            const resourceName = log.target_resource_name || 'resource';
            if (log.event_type === 'ticket_scanned') {
                aggregatedDescription = `${relatedLogs.length} tickets scanned for ${resourceName}`;
            }
            else if (log.event_type === 'ticket_sold') {
                aggregatedDescription = `${relatedLogs.length} ticket sales for ${resourceName}`;
            }
            else {
                aggregatedDescription = `${relatedLogs.length} ${eventConfig.label.toLowerCase()} events`;
            }
        }
        groups.push({
            groupKey: `${groupKey}-${log.timestamp}`,
            representativeLog: log,
            logs: relatedLogs,
            count: relatedLogs.length,
            aggregatedDescription,
            isExpandable: relatedLogs.length > 1,
        });
    }
    return groups;
}
function ActivityLogItem({ log, isGroupChild = false, }) {
    const { t } = useTranslation('common');
    const categoryConfig = CATEGORY_CONFIG[log.category];
    const Icon = CATEGORY_ICONS[log.category];
    const eventConfig = EVENT_TYPE_CONFIG[log.event_type];
    return (_jsxs("div", { className: cn('flex items-start gap-4 p-4 transition-colors', isGroupChild ? 'bg-white/5 border-l-2 border-fm-gold/30 ml-6' : '', !isGroupChild && 'hover:bg-white/5'), children: [_jsx("div", { className: cn('flex-shrink-0 w-10 h-10 rounded flex items-center justify-center', 'bg-black/40 border border-white/10'), children: _jsx(Icon, { className: cn('h-5 w-5', categoryConfig.color) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-white font-medium", children: log.description }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: cn('text-xs px-2 py-0.5 rounded', 'bg-white/10', categoryConfig.color), children: categoryConfig.label }), _jsx("span", { className: "text-xs text-muted-foreground", children: eventConfig.label })] })] }), _jsxs("div", { className: "text-right flex-shrink-0", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) }), _jsx("p", { className: "text-xs text-muted-foreground/60", children: format(new Date(log.timestamp), 'MMM d, h:mm a') })] })] }), log.user && (_jsxs("div", { className: "flex items-center gap-2 mt-2 text-xs text-muted-foreground", children: [_jsx(User, { className: "h-3 w-3" }), _jsx("span", { children: log.user.display_name || log.user.email || t('activityLogs.unknownUser') })] })), log.target_resource_name && (_jsxs("div", { className: "flex items-center gap-2 mt-1 text-xs text-muted-foreground", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), _jsx("span", { className: "truncate", children: log.target_resource_name })] }))] })] }));
}
function GroupedActivityLogItem({ group }) {
    const { t } = useTranslation('common');
    const [isExpanded, setIsExpanded] = useState(false);
    const categoryConfig = CATEGORY_CONFIG[group.representativeLog.category];
    if (!group.isExpandable) {
        return _jsx(ActivityLogItem, { log: group.representativeLog });
    }
    return (_jsxs("div", { className: "border-b border-white/10 last:border-b-0", children: [_jsxs("button", { onClick: () => setIsExpanded(!isExpanded), className: cn('w-full flex items-start gap-4 p-4 text-left transition-colors', 'hover:bg-white/5', isExpanded && 'bg-white/5'), children: [_jsx("div", { className: "flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-black/40 border border-white/10", children: isExpanded ? (_jsx(ChevronDown, { className: cn('h-5 w-5', categoryConfig.color) })) : (_jsx(ChevronRight, { className: cn('h-5 w-5', categoryConfig.color) })) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-white font-medium", children: group.aggregatedDescription }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: cn('text-xs px-2 py-0.5 rounded', 'bg-white/10', categoryConfig.color), children: categoryConfig.label }), _jsx("span", { className: "text-xs text-fm-gold", children: t('activityLogs.eventCount', { count: group.count }) })] })] }), _jsx("div", { className: "text-right flex-shrink-0", children: _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(group.representativeLog.timestamp), { addSuffix: true }) }) })] }) })] }), isExpanded && (_jsx("div", { className: "border-t border-white/5", children: group.logs.map(log => (_jsx(ActivityLogItem, { log: log, isGroupChild: true }, log.id))) }))] }));
}
export function ActivityLogList({ logs, isLoading, onLoadMore, hasMore, }) {
    const { t } = useTranslation('common');
    const groupedLogs = useMemo(() => groupLogs(logs), [logs]);
    if (isLoading && logs.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-fm-gold" }) }));
    }
    if (logs.length === 0) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [_jsx(Settings, { className: "h-12 w-12 text-muted-foreground/40 mb-4" }), _jsx("p", { className: "text-muted-foreground", children: t('activityLogs.noLogsFound') }), _jsx("p", { className: "text-sm text-muted-foreground/60 mt-1", children: t('activityLogs.tryAdjustingFilters') })] }));
    }
    return (_jsxs("div", { className: "divide-y divide-white/10", children: [groupedLogs.map(group => (_jsx(GroupedActivityLogItem, { group: group }, group.groupKey))), hasMore && (_jsx("div", { className: "p-4 flex justify-center", children: _jsx(Button, { variant: "outline", onClick: onLoadMore, disabled: isLoading, className: "border-white/20 hover:border-fm-gold", children: isLoading ? t('buttons.loading') : t('activityLogs.loadMore') }) }))] }));
}
