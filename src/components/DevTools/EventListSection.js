import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { FmCommonList, } from '@/components/common/data/FmCommonList';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { useEvents } from '@/features/events/hooks/useEvents';
export const EventListSection = () => {
    const { t } = useTranslation('common');
    const { data: events, isLoading } = useEvents();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [includePastEvents, setIncludePastEvents] = useState(false);
    // Filter and search events
    const filteredEvents = useMemo(() => {
        if (!events)
            return [];
        let filtered = [...events];
        // Filter out past events if toggle is off
        if (!includePastEvents) {
            filtered = filtered.filter(event => {
                if (!event.start_time)
                    return true;
                return !isPast(parseISO(event.start_time));
            });
        }
        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event => {
                const name = event.title?.toLowerCase() || '';
                const venueName = event.venue?.name?.toLowerCase() || '';
                const headlinerName = event.headliner?.name?.toLowerCase() || '';
                return (name.includes(query) ||
                    venueName.includes(query) ||
                    headlinerName.includes(query));
            });
        }
        return filtered;
    }, [events, searchQuery, includePastEvents]);
    const columns = [
        {
            key: 'headliner',
            label: t('eventList.headliner'),
            render: (_, item) => (_jsx("div", { className: 'font-medium text-white', children: item.headliner?.name || item.title || '-' })),
        },
        {
            key: 'start_time',
            label: t('eventList.date'),
            render: value => {
                if (!value)
                    return _jsx("span", { className: 'text-muted-foreground', children: "-" });
                try {
                    const date = parseISO(value);
                    const isEventPast = isPast(date);
                    return (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Calendar, { className: 'h-3 w-3 text-muted-foreground' }), _jsx("span", { className: isEventPast ? 'text-muted-foreground' : 'text-white', children: format(date, 'MMM dd, yyyy') })] }));
                }
                catch {
                    return _jsx("span", { className: 'text-muted-foreground', children: "-" });
                }
            },
        },
        {
            key: 'venue',
            label: t('eventList.venue'),
            render: (_, item) => (_jsx("span", { className: 'text-muted-foreground text-xs', children: item.venue?.name || '-' })),
        },
    ];
    const handleRowClick = (item) => {
        // Navigate directly to event management page
        navigate(`/event/${item.id}/manage`);
    };
    if (isLoading) {
        return (_jsx("div", { className: 'space-y-4', children: _jsx("div", { className: 'text-center py-8 text-muted-foreground', children: t('eventList.loading') }) }));
    }
    const getEmptyMessage = () => {
        if (searchQuery)
            return t('eventList.noMatchingEvents');
        if (includePastEvents)
            return t('eventList.noEventsFound');
        return t('eventList.noUpcomingEvents');
    };
    return (_jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { htmlFor: 'event-search', className: 'text-white/70 text-xs', children: t('eventList.searchEvents') }), _jsxs("div", { className: 'relative', children: [_jsx(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' }), _jsx(Input, { id: 'event-search', type: 'text', placeholder: t('eventList.searchPlaceholder'), value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: 'pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30' })] })] }), _jsxs("div", { className: 'flex items-center justify-between py-2', children: [_jsx(Label, { htmlFor: 'include-past', className: 'text-white/70 text-sm cursor-pointer', children: t('eventList.includePastEvents') }), _jsx(Switch, { id: 'include-past', checked: includePastEvents, onCheckedChange: setIncludePastEvents })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx("div", { className: 'text-white/50 text-xs mb-2', children: t('eventList.eventsFound', { count: filteredEvents.length }) }), _jsx(FmCommonList, { items: filteredEvents, columns: columns, striped: true, dense: true, emptyMessage: getEmptyMessage(), rowClassName: 'hover:bg-fm-gold/10 transition-colors border-b border-white/5', className: 'max-h-[500px] overflow-y-auto', onRowClick: handleRowClick })] })] }));
};
