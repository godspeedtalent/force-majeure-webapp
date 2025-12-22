import { jsx as _jsx } from "react/jsx-runtime";
import { Calendar } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
export const FmEventSearchDropdown = createSearchDropdown({
    tableName: 'events',
    searchField: query => `title.ilike.%${query}%,headliner.name.ilike.%${query}%,venue.name.ilike.%${query}%`,
    selectFields: 'id, title, start_time, headliner:headliner_id(id, name, image_url), venue:venue_id(id, name)',
    formatLabel: event => {
        const title = event.title || 'Untitled Event';
        const date = new Date(event.start_time).toLocaleDateString();
        return `${title} - ${date}`;
    },
    renderIcon: event => event.headliner?.image_url ? (_jsx("img", { src: event.headliner.image_url, alt: event.title || 'Event', className: 'h-8 w-8 rounded-full object-cover' })) : (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(Calendar, { className: 'h-4 w-4 text-white/50' }) })),
    defaultPlaceholder: 'Search for an event...',
    createNewLabel: '+ Create New Event',
    createRoute: '/events/create',
    useRecents: true,
    recentsKey: 'events',
    typeIcon: _jsx(Calendar, { className: 'h-3 w-3 text-white/70' }),
    typeTooltip: 'Event',
    editRoute: '/developer/database',
    entityTypeName: 'Event',
});
