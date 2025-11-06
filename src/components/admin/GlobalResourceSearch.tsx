import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Music, MapPin, Calendar, User } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/shared/hooks';

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
}

interface UserProfile {
  id: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
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
  name: string;
  date: string;
  image_url?: string | null;
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
 * Global resource search component
 * Searches across all major tables with debounced queries
 */
export function GlobalResourceSearch() {
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
      // Search Users (profiles table)
      const { data: users } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .ilike('display_name', searchPattern)
        .limit(5);

      // Get today's date for upcoming events filter
      const today = new Date().toISOString();

      // Search Events
      const { data: events } = await supabase
        .from('events')
        .select('id, name, date, image_url')
        .gte('date', today)
        .ilike('name', searchPattern)
        .order('date', { ascending: true })
        .limit(5);

      // Search Artists
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, image_url')
        .ilike('name', searchPattern)
        .limit(5);

      setResults({
        organizations: [], // TODO: Add when organizations table is available
        users: (users || []).map((u: any) => ({
          id: u.id,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
        })),
        artists: artists || [],
        venues: [], // TODO: Add when venues table is available
        events: (events || []).map((e: any) => ({
          ...e,
          venue_name: 'TBD', // TODO: Join with venues when available
        })),
      });
    } catch (error) {
      console.error('Search error:', error);
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

  const handleNavigate = (type: string, id: string) => {
    const routes: Record<string, string> = {
      organization: `/admin/organizations/${id}`,
      user: `/admin/users/${id}`,
      artist: `/admin/artists/${id}`,
      venue: `/admin/venues/${id}`,
      event: `/events/${id}`,
    };
    navigate(routes[type]);
    
    // Clear search after navigation
    setSearchQuery('');
    setResults({
      organizations: [],
      users: [],
      artists: [],
      venues: [],
      events: [],
    });
  };

  return (
    <div className="w-full">
      {/* Description */}
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">
          Search across all database resources
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search users, artists, events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results - Inline Display */}
      {searchQuery.trim().length >= 2 && hasResults && (
        <div className="border rounded-md max-h-[400px] overflow-y-auto bg-background/50">
          {/* Organizations */}
          {results.organizations.length > 0 && (
            <div className="p-2 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                Organizations
              </h3>
              {results.organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleNavigate('organization', org.id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="p-2 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                Users
              </h3>
              {results.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleNavigate('user', user.id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name || user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.display_name || user.full_name || 'Unknown User'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <div className="p-2 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                Artists
              </h3>
              {results.artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleNavigate('artist', artist.id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{artist.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Venues */}
          {results.venues.length > 0 && (
            <div className="p-2 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                Venues
              </h3>
              {results.venues.map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => handleNavigate('venue', venue.id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {venue.image_url ? (
                      <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{venue.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                Events
              </h3>
              {results.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleNavigate('event', event.id)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                    ) : (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(event.date).toLocaleDateString()} • {event.venue_name}
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
        <div className="border rounded-md p-4 bg-background/50">
          <p className="text-sm text-muted-foreground text-center">
            No results found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
