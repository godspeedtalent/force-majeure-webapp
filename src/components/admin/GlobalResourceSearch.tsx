import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  Music,
  MapPin,
  Calendar,
  User,
  X,
} from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { supabase } from '@/shared';
import { useDebounce } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { cn } from '@/shared';
import { logger } from '@/shared';

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
 * Global resource search component
 * Searches across all major tables with debounced queries
 */
export function GlobalResourceSearch({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults({
        organizations: [],
        users: [],
        artists: [],
        venues: [],
        events: [],
      });
    }
  }, [isOpen]);

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

        usersWithEmail = Array.from(allUserIds).slice(0, 10).map(userId => {
          const profile = users.find(u => u.user_id === userId);
          const authUser = authUsers?.users.find(au => au.id === userId);

          return {
            id: userId,
            user_id: userId,
            display_name: profile?.display_name ?? null,
            full_name: profile?.full_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            email: authUser?.email,
          };
        }).filter(u => u.email); // Only include users with email
      }

      // Get today's date for upcoming events filter
      const today = new Date().toISOString();

      // Search Events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_time')
        .gte('start_time', today)
        .ilike('title', searchPattern)
        .order('start_time', { ascending: true })
        .limit(5);

      // Search Artists
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, image_url')
        .ilike('name', searchPattern)
        .limit(5);

      // Search Venues - Note: venues table may not exist yet in types
      let venues: Venue[] = [];
      try {
        const { data: venueData } = await supabase
          .from('venues' as any)
          .select('id, name, image_url')
          .ilike('name', searchPattern)
          .limit(5);
        venues = (venueData || []) as unknown as Venue[];
      } catch (venueError) {
        // Venues table might not exist, silently continue
        logger.warn('Venues search failed:', { error: venueError });
      }

      setResults({
        organizations: [], // TODO: Add when organizations table is available
        users: usersWithEmail,
        artists: artists || [],
        venues,
        events: (events || []).map((e: any) => ({
          ...e,
          venue_name: 'TBD', // TODO: Join with venues when available
        })),
      });
    } catch (error) {
      await handleError(error, {
        title: t('globalSearch.searchFailed'),
        description: t('globalSearch.searchFailedDescription'),
        endpoint: 'GlobalResourceSearch',
        method: 'SEARCH',
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

  // Handle click outside
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-lg'
      onClick={handleOverlayClick}
    >
      <div className='w-full max-w-2xl'>
        {/* Search Box */}
        <div className='relative bg-background/95 backdrop-blur-xl border border-border rounded-none shadow-2xl'>
          {/* Close Button */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-none hover:bg-muted transition-colors z-10'
            aria-label={t('globalSearch.closeSearch')}
          >
            <X className='h-5 w-5 text-muted-foreground' />
          </button>

          {/* Search Input */}
          <div className='relative p-6 border-b border-border'>
            <Search className='absolute left-9 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
            <Input
              ref={inputRef}
              type='text'
              placeholder={t('globalSearch.placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                'text-lg border-0 focus-visible:ring-0 shadow-none bg-transparent pl-9 pr-4',
                searchQuery && 'border-b-2 border-b-gold-500'
              )}
            />
            {isSearching && (
              <div className='absolute right-4 top-1/2 -translate-y-1/2'>
                <div className='h-5 w-5 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
              </div>
            )}
          </div>

          {/* Results */}
          {searchQuery.trim().length >= 2 && (
            <div className='max-h-[60vh] overflow-y-auto p-2'>
              {isSearching ? (
                <div className='py-8 text-center text-muted-foreground'>
                  {t('globalSearch.searching')}
                </div>
              ) : hasResults ? (
                <div className='space-y-0'>
                  {/* Organizations */}
                  {results.organizations.length > 0 && (
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10'>
                        {t('globalSearch.sections.organizations')}
                      </div>
                      {results.organizations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => handleNavigate('organization', org.id)}
                          className='w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left'
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
                            <p className='text-sm font-medium truncate'>
                              {org.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Users */}
                  {results.users.length > 0 && (
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10'>
                        {t('globalSearch.sections.users')}
                      </div>
                      {results.users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleNavigate('user', user.id)}
                          className='w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left'
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
                              {user.display_name || user.full_name || t('globalSearch.unknownUser')}
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
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10'>
                        {t('globalSearch.sections.artists')}
                      </div>
                      {results.artists.map(artist => (
                        <button
                          key={artist.id}
                          onClick={() => handleNavigate('artist', artist.id)}
                          className='w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left'
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
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10'>
                        {t('globalSearch.sections.venues')}
                      </div>
                      {results.venues.map(venue => (
                        <button
                          key={venue.id}
                          onClick={() => handleNavigate('venue', venue.id)}
                          className='w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left'
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
                            <p className='text-sm font-medium truncate'>
                              {venue.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Events */}
                  {results.events.length > 0 && (
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10'>
                        {t('globalSearch.sections.events')}
                      </div>
                      {results.events.map(event => (
                        <button
                          key={event.id}
                          onClick={() => handleNavigate('event', event.id)}
                          className='w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left'
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
              ) : (
                <div className='py-8 text-center text-muted-foreground'>
                  {t('globalSearch.noResults', { query: searchQuery })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
