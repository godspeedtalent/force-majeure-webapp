import { jsx as _jsx } from "react/jsx-runtime";
import { MapPin } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
export const FmVenueSearchDropdown = createSearchDropdown({
    tableName: 'venues',
    searchField: 'name',
    selectFields: 'id, name, city',
    formatLabel: venue => `${venue.name}${venue.city ? ` - ${venue.city}` : ''}`,
    renderIcon: () => (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(MapPin, { className: 'h-4 w-4 text-white/50' }) })),
    defaultPlaceholder: 'Search for a venue...',
    createNewLabel: '+ Create New Venue',
    createRoute: '/venues/create',
    useRecents: false,
    typeIcon: _jsx(MapPin, { className: 'h-3 w-3 text-white/70' }),
    typeTooltip: 'Venue',
    editRoute: '/developer/database',
    entityTypeName: 'Venue',
});
