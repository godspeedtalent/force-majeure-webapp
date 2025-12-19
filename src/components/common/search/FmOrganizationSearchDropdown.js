import { jsx as _jsx } from "react/jsx-runtime";
import { Building2 } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
export const FmOrganizationSearchDropdown = createSearchDropdown({
    tableName: 'organizations',
    searchField: 'name',
    selectFields: 'id, name, profile_picture',
    formatLabel: organization => organization.name,
    renderIcon: organization => organization.profile_picture ? (_jsx("img", { src: organization.profile_picture, alt: organization.name, className: 'h-8 w-8 rounded-full object-cover' })) : (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(Building2, { className: 'h-4 w-4 text-white/50' }) })),
    defaultPlaceholder: 'Search for an organization...',
    createNewLabel: '+ Create New Organization',
    createRoute: '/organizations/create',
    useRecents: true,
    recentsKey: 'organizations',
    typeIcon: _jsx(Building2, { className: 'h-3 w-3 text-white/70' }),
    typeTooltip: 'Organization',
});
