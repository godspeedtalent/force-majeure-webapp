import { jsx as _jsx } from "react/jsx-runtime";
import { User } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
export const FmArtistSearchDropdown = createSearchDropdown({
    tableName: 'artists',
    searchField: 'name',
    selectFields: 'id, name, image_url',
    formatLabel: artist => artist.name,
    renderIcon: artist => artist.image_url ? (_jsx("img", { src: artist.image_url, alt: artist.name, className: 'h-8 w-8 rounded-full object-cover' })) : (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(User, { className: 'h-4 w-4 text-white/50' }) })),
    defaultPlaceholder: 'Search for an artist...',
    createNewLabel: '+ Create New Artist',
    createRoute: '/artists/create',
    useRecents: true,
    recentsKey: 'artists',
    typeIcon: _jsx(User, { className: 'h-3 w-3 text-white/70' }),
    typeTooltip: 'Artist',
    editRoute: '/developer/database',
    entityTypeName: 'Artist',
});
