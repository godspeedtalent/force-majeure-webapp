import { jsx as _jsx } from "react/jsx-runtime";
import { MapPin } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
export const FmCitySearchDropdown = createSearchDropdown({
    tableName: 'cities',
    searchField: query => `name.ilike.%${query}%,state.ilike.%${query}%`,
    selectFields: 'id, name, state',
    formatLabel: city => `${city.name}, ${city.state}`,
    renderIcon: () => (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(MapPin, { className: 'h-4 w-4 text-white/50' }) })),
    defaultPlaceholder: 'Search for a city...',
    createNewLabel: '+ Create New City',
    useRecents: false,
});
