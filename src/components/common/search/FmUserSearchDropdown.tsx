import * as React from 'react';
import { User } from 'lucide-react';
import {
  FmCommonSearchDropdown,
  SearchDropdownOption,
} from './FmCommonSearchDropdown';
import { supabase, logger } from '@/shared';
import { useRecentSelections } from '@/shared';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  organization_id: string | null;
}

interface UserSearchResult extends UserProfile {
  artist_name?: string | null;
  organization_name?: string | null;
  match_type: 'full_name' | 'username' | 'email' | 'artist' | 'organization';
  match_priority: number;
}

interface FmUserSearchDropdownProps {
  value?: string | null;
  onChange: (value: string, profile?: UserProfile) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Match priority: 1 = Full Name, 2 = Username, 3 = Email, 4 = Artist, 5 = Organization
const MATCH_PRIORITIES: Record<UserSearchResult['match_type'], number> = {
  full_name: 1,
  username: 2,
  email: 3,
  artist: 4,
  organization: 5,
};

function determineMatchType(
  profile: UserProfile & { artist_name?: string | null; organization_name?: string | null },
  query: string
): UserSearchResult['match_type'] {
  const lowerQuery = query.toLowerCase();

  // Check in priority order
  if (profile.full_name?.toLowerCase().includes(lowerQuery)) {
    return 'full_name';
  }
  if (profile.username?.toLowerCase().includes(lowerQuery)) {
    return 'username';
  }
  if (profile.email?.toLowerCase().includes(lowerQuery)) {
    return 'email';
  }
  if (profile.artist_name?.toLowerCase().includes(lowerQuery)) {
    return 'artist';
  }
  if (profile.organization_name?.toLowerCase().includes(lowerQuery)) {
    return 'organization';
  }

  // Default to full_name if no match found (shouldn't happen)
  return 'full_name';
}

function formatUserOption(result: UserSearchResult): SearchDropdownOption {
  const { match_type, full_name, username, email, artist_name, organization_name, user_id } = result;

  let label: string;
  let subtitle: string | undefined;

  // Determine label based on match type
  // If matched by username, show username as main display with full_name as footnote
  // Otherwise, show full_name as main display with matched value as footnote
  if (match_type === 'username') {
    label = username || full_name || user_id || 'Unknown User';
    subtitle = full_name || undefined;
  } else {
    // Default display is full_name
    label = full_name || username || user_id || 'Unknown User';

    // Show the matched field as subtitle (if different from label)
    switch (match_type) {
      case 'email':
        subtitle = email || undefined;
        break;
      case 'artist':
        subtitle = artist_name ? `Artist: ${artist_name}` : undefined;
        break;
      case 'organization':
        subtitle = organization_name ? `Org: ${organization_name}` : undefined;
        break;
      case 'full_name':
      default:
        // No subtitle needed when matched by full_name
        subtitle = undefined;
        break;
    }
  }

  return {
    id: result.user_id,
    label,
    subtitle,
    icon: result.avatar_url ? (
      <img
        src={result.avatar_url}
        alt={result.display_name || 'User'}
        className='h-8 w-8 rounded-full object-cover'
      />
    ) : (
      <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
        <User className='h-4 w-4 text-white/50' />
      </div>
    ),
    data: result,
  };
}

export function FmUserSearchDropdown({
  value,
  onChange,
  placeholder = 'Search for a user...',
  disabled = false,
}: FmUserSearchDropdownProps) {
  const [selectedItem, setSelectedItem] = React.useState<{
    label: string;
    icon?: React.ReactNode;
    data?: UserProfile;
  } | null>(null);

  const { recentItems, addRecentItem } = useRecentSelections('users');

  // Load selected item when value changes
  React.useEffect(() => {
    if (value) {
      supabase
        .from('profiles')
        .select('id, user_id, display_name, full_name, email, username, avatar_url, organization_id')
        .eq('user_id', value)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedItem({
              label: data.full_name || data.display_name || data.user_id || 'Unknown User',
              icon: data.avatar_url ? (
                <img
                  src={data.avatar_url}
                  alt={data.display_name || 'User'}
                  className='h-8 w-8 rounded-full object-cover'
                />
              ) : (
                <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
                  <User className='h-4 w-4 text-white/50' />
                </div>
              ),
              data: data as UserProfile,
            });
          }
        });
    } else {
      setSelectedItem(null);
    }
  }, [value]);

  // Search handler with multi-table search
  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    try {
      // Search profiles with joined artist and organization data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          full_name,
          email,
          username,
          avatar_url,
          organization_id,
          organizations!profiles_organization_id_fkey (
            name
          )
        `)
        .or(
          `full_name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(20);

      if (profileError) {
        logger.error('Profile search failed', {
          source: 'FmUserSearchDropdown',
          error: profileError.message,
        });
      }

      // Search for artists linked to profiles
      const { data: artistMatches, error: artistError } = await supabase
        .from('artists')
        .select(`
          name,
          user_id
        `)
        .ilike('name', `%${query}%`)
        .not('user_id', 'is', null)
        .limit(10);

      if (artistError) {
        logger.error('Artist search failed', {
          source: 'FmUserSearchDropdown',
          error: artistError.message,
        });
      }

      // Search for organizations linked to profiles
      const { data: orgMatches, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (orgError) {
        logger.error('Organization search failed', {
          source: 'FmUserSearchDropdown',
          error: orgError.message,
        });
      }

      // Collect user_ids from artist matches (filter out nulls)
      const artistUserIds = (artistMatches || [])
        .map(a => a.user_id)
        .filter((id): id is string => id !== null);

      // Collect organization_ids from org matches
      const matchedOrgIds = orgMatches?.map(o => o.id) || [];

      // Fetch profiles for artist matches (if not already in profiles)
      let artistProfiles: typeof profiles = [];
      if (artistUserIds.length > 0) {
        const existingUserIds = new Set(profiles?.map(p => p.user_id) || []);
        const newArtistUserIds = artistUserIds.filter(id => !existingUserIds.has(id));

        if (newArtistUserIds.length > 0) {
          const { data: additionalProfiles } = await supabase
            .from('profiles')
            .select(`
              id,
              user_id,
              display_name,
              full_name,
              email,
              username,
              avatar_url,
              organization_id,
              organizations!profiles_organization_id_fkey (
                name
              )
            `)
            .in('user_id', newArtistUserIds as string[]);

          artistProfiles = additionalProfiles || [];
        }
      }

      // Fetch profiles for organization matches (if not already in profiles)
      let orgProfiles: typeof profiles = [];
      if (matchedOrgIds.length > 0) {
        const existingUserIds = new Set([
          ...(profiles?.map(p => p.user_id) || []),
          ...(artistProfiles?.map(p => p.user_id) || []),
        ]);

        const { data: additionalProfiles } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            display_name,
            full_name,
            email,
            username,
            avatar_url,
            organization_id,
            organizations!profiles_organization_id_fkey (
              name
            )
          `)
          .in('organization_id', matchedOrgIds);

        orgProfiles = (additionalProfiles || []).filter(
          p => !existingUserIds.has(p.user_id)
        );
      }

      // Combine all profiles
      const allProfiles = [
        ...(profiles || []),
        ...artistProfiles,
        ...orgProfiles,
      ];

      // Create a map of user_id to artist name
      const artistNameMap = new Map<string, string>();
      artistMatches?.forEach(a => {
        if (a.user_id) {
          artistNameMap.set(a.user_id, a.name);
        }
      });

      // Create a map of org_id to org name
      const orgNameMap = new Map<string, string>();
      orgMatches?.forEach(o => {
        orgNameMap.set(o.id, o.name);
      });

      // Process and deduplicate results
      const seenUserIds = new Set<string>();
      const results: UserSearchResult[] = [];

      for (const profile of allProfiles) {
        if (seenUserIds.has(profile.user_id)) continue;
        seenUserIds.add(profile.user_id);

        const artistName = artistNameMap.get(profile.user_id) || null;
        const organizationName =
          (profile.organizations as { name: string } | null)?.name ||
          (profile.organization_id ? orgNameMap.get(profile.organization_id) : null) ||
          null;

        const enrichedProfile = {
          ...profile,
          organization_id: profile.organization_id,
          artist_name: artistName,
          organization_name: organizationName,
        } as UserProfile & { artist_name?: string | null; organization_name?: string | null };

        const matchType = determineMatchType(enrichedProfile, query);

        results.push({
          ...enrichedProfile,
          match_type: matchType,
          match_priority: MATCH_PRIORITIES[matchType],
        });
      }

      // Sort by match priority
      results.sort((a, b) => a.match_priority - b.match_priority);

      // Format and return top 10
      return results.slice(0, 10).map(formatUserOption);
    } catch (error) {
      logger.error('User search failed', {
        source: 'FmUserSearchDropdown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  };

  // Recent options handler
  const handleGetRecentOptions = async (): Promise<SearchDropdownOption[]> => {
    if (recentItems.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, full_name, email, username, avatar_url, organization_id')
      .in(
        'user_id',
        recentItems.map(item => item.id)
      );

    if (error || !data) return [];

    return data.map(profile => ({
      id: profile.user_id,
      label: profile.full_name || profile.display_name || profile.user_id || 'Unknown User',
      icon: profile.avatar_url ? (
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
      data: profile,
    }));
  };

  // Change handler
  const handleChange = (newValue: string, label?: string, data?: unknown) => {
    onChange(newValue, data as UserProfile);
    if (label) {
      addRecentItem(newValue, label);
    }
  };

  return (
    <FmCommonSearchDropdown
      onChange={handleChange}
      onSearch={handleSearch}
      onGetRecentOptions={handleGetRecentOptions}
      placeholder={placeholder}
      createNewLabel=''
      selectedLabel={selectedItem?.label}
      selectedIcon={selectedItem?.icon}
      disabled={disabled}
    />
  );
}
