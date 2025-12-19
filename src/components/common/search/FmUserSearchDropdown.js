import { jsx as _jsx } from "react/jsx-runtime";
import { User } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
export const FmUserSearchDropdown = createSearchDropdown({
    tableName: 'profiles',
    searchField: 'display_name',
    selectFields: 'id, user_id, display_name, full_name, avatar_url',
    formatLabel: profile => profile.full_name || profile.display_name || profile.user_id || 'Unknown User',
    formatValue: profile => profile.user_id, // Return user_id instead of profile id
    valueField: 'user_id', // Use user_id for lookups instead of id
    renderIcon: profile => profile.avatar_url ? (_jsx("img", { src: profile.avatar_url, alt: profile.display_name || 'User', className: 'h-8 w-8 rounded-full object-cover' })) : (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(User, { className: 'h-4 w-4 text-white/50' }) })),
    defaultPlaceholder: 'Search for a user...',
    createNewLabel: '', // Empty string - users cannot be created from here
    useRecents: true,
    recentsKey: 'users',
});
