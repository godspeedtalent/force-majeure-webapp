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
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useFuzzySearch, cn } from '@/shared';

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
 * Searches across all major tables with fuzzy/typo-tolerant matching
 * Uses pg_trgm + Fuse.js for better search results
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the fuzzy search hook for typo-tolerant searching
  const { results: fuzzyResults, isLoading: isSearching } = useFuzzySearch({
    query: searchQuery,
    tables: ['profiles', 'artists', 'venues', 'events'],
    limit: 5,
    debounceMs: 300,
    minQueryLength: 2,
    upcomingEventsOnly: true, // Only show upcoming events in global search
    enabled: isOpen && searchQuery.trim().length >= 2,
  });

  // Map fuzzy results to the component's SearchResults interface
  const results = useMemo<SearchResults>(
    () => ({
      organizations: [], // TODO: Add when organizations search is needed
      users: fuzzyResults.profiles.map(r => ({
        id: r.item.id,
        user_id: r.item.user_id,
        display_name: r.item.display_name ?? null,
        full_name: r.item.full_name ?? null,
        avatar_url: r.item.avatar_url ?? null,
      })),
      artists: fuzzyResults.artists.map(r => ({
        id: r.item.id,
        name: r.item.name,
        image_url: r.item.image_url,
      })),
      venues: fuzzyResults.venues.map(r => ({
        id: r.item.id,
        name: r.item.name,
        image_url: r.item.image_url,
      })),
      events: fuzzyResults.events.map(r => ({
        id: r.item.id,
        title: r.item.title,
        date: r.item.start_time || '',
        hero_image: r.item.hero_image,
        venue_name: 'TBD', // Would need venue join for this
      })),
    }),
    [fuzzyResults]
  );

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
    }
  }, [isOpen]);

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
      artist: `/artists/${id}`,
      venue: `/venues/${id}`,
      event: `/event/${id}`,
    };
    navigate(routes[type]);

    // Clear search after navigation
    setSearchQuery('');
    onClose();
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
                <FmCommonLoadingSpinner size='sm' />
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
                                alt={
                                  user.display_name || user.full_name || 'User'
                                }
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <User className='h-4 w-4 text-muted-foreground' />
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium truncate'>
                              {user.display_name ||
                                user.full_name ||
                                t('globalSearch.unknownUser')}
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
