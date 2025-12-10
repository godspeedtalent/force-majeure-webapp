import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Music, MapPin, Calendar, User } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { supabase } from '@force-majeure/shared';
import { useDebounce } from '@force-majeure/shared';
import { handleError } from '@/shared/services/errorHandler';
import { logger } from '@force-majeure/shared';

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
}

interface Artist {
  id: string;
  name: string;
  image_url?: string | null;
}

interface Venue {
  id: string;
  name: string;
  image_url?: string | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  hero_image?: string | null;
  venue_name?: string;
}

interface SearchResults {
  organizations: Organization[];
  users: UserProfile[];
  artists: Artist[];
  venues: Venue[];
  events: Event[];
}

/**
 * Inline database navigator search component
 * Designed to be embedded within the Database Manager toolbar
 */
export function DatabaseNavigatorSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    organizations: [],
    users: [],
    artists: [],
    venues: [],
    events: [],
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
      setResults({
        organizations: [],
        users: [],
        artists: [],
        venues: [],
        events: [],
      });
      return;
    }

    performSearch(debouncedSearchQuery.trim());
  }, [debouncedSearchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    const searchPattern = `%${query}%`;

    try {
      // Search Users (profiles table) - search by display_name, full_name, or email
      const { data: users } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, full_name, avatar_url')
        .or(`display_name.ilike.${searchPattern},full_name.ilike.${searchPattern}`)
        .limit(10);

      // Get emails for matched users from auth.users
      let usersWithEmail = users || [];
      if (users && users.length > 0) {
        const userIds = users.map(u => u.user_id);

        // Also search auth.users by email
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const emailMatches = authUsers?.users.filter(au =>
          au.email?.toLowerCase().includes(query.toLowerCase())
        ) || [];

        // Merge results
        const allUserIds = new Set([
          ...userIds,
          ...emailMatches.map(u => u.id)
        ]);

        usersWithEmail = Array.from(allUserIds).slice(0, 5).map(userId => {
          const profile = users.find(u => u.user_id === userId);
          const authUser = authUsers?.users.find(au => au.id === userId);

          return {
            id: userId,
            user_id: userId,
            display_name: profile?.display_name || null,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            email: authUser?.email,
          };
        }).filter(u => u.email); // Only include users with email
      }

      // Search Artists
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, image_url')
        .ilike('name', searchPattern)
        .limit(5);

      // Search events by title, description, venue name, and artist names
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_time,
          hero_image,
          venue:venue_id(name),
          headliner:headliner_id(name)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(50);

      // Filter by venue or artist names
      const filteredEvents = (eventsData || []).filter((event: any) => {
        const queryLower = query.toLowerCase();
        const titleMatch = event.title?.toLowerCase().includes(queryLower);
        const descMatch = event.description?.toLowerCase().includes(queryLower);
        const venueMatch = event.venue?.name?.toLowerCase().includes(queryLower);
        const headlinerMatch = event.headliner?.name?.toLowerCase().includes(queryLower);
        
        return titleMatch || descMatch || venueMatch || headlinerMatch;
      }).slice(0, 5);

      // Search Organizations - with type casting for missing table
      let organizations: Organization[] = [];
      try {
        const { data: orgData } = await (supabase as any)
          .from('organizations')
          .select('id, name, logo_url')
          .ilike('name', searchPattern)
          .limit(5);
        organizations = (orgData || []) as Organization[];
      } catch (error) {
        logger.warn('Organizations table search failed', { error });
      }

      // Search Venues - with error handling for missing table/columns
      let venues: Venue[] = [];
      try {
        const { data: venueData } = await (supabase as any)
          .from('venues')
          .select('id, name')
          .ilike('name', searchPattern)
          .limit(5);
        venues = (venueData || []) as Venue[];
      } catch (error) {
        logger.warn('Venues table search failed', { error });
      }

      setResults({
        organizations,
        users: usersWithEmail,
        artists: artists || [],
        venues,
        events: filteredEvents.map((e: any) => ({
          id: e.id,
          title: e.title || '',
          date: e.start_time || '',
          hero_image: e.hero_image,
          venue_name: e.venue?.name,
        })),
      });
    } catch (error) {
      handleError(error, {
        title: 'Search Failed',
        context: `Searching database resources for: ${query}`,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = useMemo(() => {
    return (
      results.organizations.length > 0 ||
      results.users.length > 0 ||
      results.artists.length > 0 ||
      results.venues.length > 0 ||
      results.events.length > 0
    );
  }, [results]);

  const handleNavigate = (resourceType: string, resourceId: string) => {
    // Close search results by clearing query
    setSearchQuery('');

    // Navigate based on resource type
    switch (resourceType) {
      case 'organization':
        navigate(`/organization/${resourceId}`);
        break;
      case 'user':
        navigate(`/admin/users/${resourceId}`);
        break;
      case 'artist':
        navigate(`/artists/${resourceId}`);
        break;
      case 'venue':
        navigate(`/venues/${resourceId}`);
        break;
      case 'event':
        navigate(`/event/${resourceId}`);
        break;
    }
  };

  return (
    <div className='w-full'>
      {/* Description */}
      <div className='mb-3'>
        <p className='text-sm text-muted-foreground'>
          Search across all database resources
        </p>
      </div>

      {/* Search Input */}
      <div className='relative mb-4'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          type='text'
          placeholder='Search users, artists, events...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='pl-9 pr-4'
        />
        {isSearching && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            <div className='h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
          </div>
        )}
      </div>

      {/* Results - Inline Display */}
      {searchQuery.trim().length >= 2 && hasResults && (
        <div className='border rounded-md max-h-[400px] overflow-y-auto bg-background/50'>
          {/* Organizations */}
          {results.organizations.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                Organizations
              </h3>
              {results.organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => handleNavigate('organization', org.id)}
                  className='w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left'
                >
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Building2 className='h-4 w-4 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{org.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                Users
              </h3>
              {results.users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleNavigate('user', user.id)}
                  className='w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left'
                >
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || user.full_name || 'User'}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <User className='h-4 w-4 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {user.display_name || user.full_name || 'Unknown User'}
                    </p>
                    {user.email && (
                      <p className='text-xs text-muted-foreground truncate'>
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                Artists
              </h3>
              {results.artists.map(artist => (
                <button
                  key={artist.id}
                  onClick={() => handleNavigate('artist', artist.id)}
                  className='w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left'
                >
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Music className='h-4 w-4 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {artist.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Venues */}
          {results.venues.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                Venues
              </h3>
              {results.venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => handleNavigate('venue', venue.id)}
                  className='w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left'
                >
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                    {venue.image_url ? (
                      <img
                        src={venue.image_url}
                        alt={venue.name}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <MapPin className='h-4 w-4 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{venue.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div className='p-2'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                Events
              </h3>
              {results.events.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleNavigate('event', event.id)}
                  className='w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left'
                >
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                    {event.hero_image ? (
                      <img
                        src={event.hero_image}
                        alt={event.title}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {event.title}
                    </p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {new Date(event.date).toLocaleDateString()} •{' '}
                      {event.venue_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {searchQuery.trim().length >= 2 && !hasResults && !isSearching && (
        <div className='border rounded-md p-4 bg-background/50'>
          <p className='text-sm text-muted-foreground text-center'>
            No results found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
