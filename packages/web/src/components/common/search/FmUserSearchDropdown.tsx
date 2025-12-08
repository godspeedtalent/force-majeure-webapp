import { User } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export const FmUserSearchDropdown = createSearchDropdown<UserProfile>({
  tableName: 'profiles',
  searchField: 'display_name',
  selectFields: 'id, user_id, display_name, full_name, avatar_url',
  formatLabel: profile =>
    profile.full_name || profile.display_name || profile.user_id || 'Unknown User',
  formatValue: profile => profile.user_id, // Return user_id instead of profile id
  valueField: 'user_id', // Use user_id for lookups instead of id
  renderIcon: profile =>
    profile.avatar_url ? (
      <img
        src={profile.avatar_url}
        alt={profile.display_name || 'User'}
        className='h-8 w-8 rounded-full object-cover'
      />
    ) : (
      <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
        <User className='h-4 w-4 text-white/50' />
      </div>
    ),
  defaultPlaceholder: 'Search for a user...',
  createNewLabel: '', // Empty string - users cannot be created from here
  useRecents: true,
  recentsKey: 'users',
});
