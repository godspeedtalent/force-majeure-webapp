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
  Disc3,
  ExternalLink,
  Key,
  Eye,
  Settings,
  Shield,
  Headphones,
} from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  FmCommonContextMenu,
  ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';
import { useFuzzySearch, cn, useUserPermissions, ROLES } from '@/shared';

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
  status?: string | null;
}

interface Recording {
  id: string;
  name: string;
  url: string;
  cover_art?: string | null;
  platform: string;
  artist_name?: string;
}

interface SearchResults {
  organizations: Organization[];
  users: UserProfile[];
  artists: Artist[];
  venues: Venue[];
  events: Event[];
  recordings: Recording[];
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

  // Check if user is admin or developer for restricted content
  const { hasAnyRole } = useUserPermissions();
  const isAdminOrDev = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  // Use the fuzzy search hook for typo-tolerant searching
  const { results: fuzzyResults, isLoading: isSearching } = useFuzzySearch({
    query: searchQuery,
    tables: ['profiles', 'artists', 'venues', 'events', 'recordings'],
    limit: 5,
    debounceMs: 300,
    minQueryLength: 2,
    upcomingEventsOnly: false, // Show all published events (past and upcoming)
    includeTestEvents: isAdminOrDev, // Include test events for admin/dev users
    enabled: isOpen && searchQuery.trim().length >= 2,
  });

  // Map fuzzy results to the component's SearchResults interface
  // Filter out restricted content for non-admin/dev users:
  // - Users are only visible to admins/devs
  // - Draft events are only visible to admins/devs
  const results = useMemo<SearchResults>(
    () => ({
      organizations: [], // TODO: Add when organizations search is needed
      // Users only visible to admins/devs
      users: isAdminOrDev
        ? fuzzyResults.profiles.map(r => ({
            id: r.item.id,
            user_id: r.item.user_id,
            display_name: r.item.display_name ?? null,
            full_name: r.item.full_name ?? null,
            avatar_url: r.item.avatar_url ?? null,
          }))
        : [],
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
      // Filter draft and test events for non-admin/dev users
      events: fuzzyResults.events
        .filter(r => isAdminOrDev || r.item.status === 'published')
        .map(r => ({
          id: r.item.id,
          title: r.item.title,
          date: r.item.start_time || '',
          hero_image: r.item.hero_image,
          venue_name: 'TBD', // Would need venue join for this
          status: r.item.status,
        })),
      recordings: fuzzyResults.recordings.map(r => ({
        id: r.item.id,
        name: r.item.name,
        url: r.item.url,
        cover_art: r.item.cover_art,
        platform: r.item.platform,
        artist_name: r.item.artist_name ?? undefined,
      })),
    }),
    [fuzzyResults, isAdminOrDev]
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
      results.events.length > 0 ||
      results.recordings.length > 0
    );
  }, [results]);

  // Handle opening recording in new tab
  const handleOpenRecording = useCallback(
    (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setSearchQuery('');
      onClose();
    },
    [onClose]
  );

  const handleNavigate = useCallback(
    (type: string, id: string) => {
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
    },
    [navigate, onClose]
  );

  // Helper to get platform display name for recordings
  const getPlatformDisplayName = useCallback(
    (platform: string): string => {
      const platformNames: Record<string, string> = {
        soundcloud: 'SoundCloud',
        spotify: 'Spotify',
        youtube: 'YouTube',
        bandcamp: 'Bandcamp',
        apple_music: 'Apple Music',
        mixcloud: 'Mixcloud',
      };
      return platformNames[platform.toLowerCase()] || platform;
    },
    []
  );

  // Helper to navigate and close the search modal
  const navigateAndClose = useCallback(
    (path: string) => {
      navigate(path);
      setSearchQuery('');
      onClose();
    },
    [navigate, onClose]
  );

  // Context menu actions for each entity type
  const getOrganizationActions = useCallback(
    (org: Organization): ContextMenuAction<Organization>[] => [
      {
        label: t('globalSearch.contextMenu.view'),
        icon: <Eye className='h-4 w-4' />,
        onClick: () => handleNavigate('organization', org.id),
      },
      {
        label: t('globalSearch.contextMenu.adminDetails'),
        icon: (
          <span className='flex items-center gap-1'>
            <Key className='h-3 w-3 text-fm-gold' />
            <Shield className='h-4 w-4' />
          </span>
        ),
        onClick: () => navigateAndClose(`/admin/organizations/${org.id}`),
        hidden: () => !isAdminOrDev,
      },
    ],
    [t, handleNavigate, navigateAndClose, isAdminOrDev]
  );

  const getUserActions = useCallback(
    (user: UserProfile): ContextMenuAction<UserProfile>[] => [
      {
        label: t('globalSearch.contextMenu.adminDetails'),
        icon: (
          <span className='flex items-center gap-1'>
            <Key className='h-3 w-3 text-fm-gold' />
            <Shield className='h-4 w-4' />
          </span>
        ),
        onClick: () => navigateAndClose(`/admin/users/${user.id}`),
      },
    ],
    [t, navigateAndClose]
  );

  const getArtistActions = useCallback(
    (artist: Artist): ContextMenuAction<Artist>[] => [
      {
        label: t('globalSearch.contextMenu.view'),
        icon: <Eye className='h-4 w-4' />,
        onClick: () => handleNavigate('artist', artist.id),
      },
      {
        label: t('globalSearch.contextMenu.manage'),
        icon: (
          <span className='flex items-center gap-1'>
            <Key className='h-3 w-3 text-fm-gold' />
            <Settings className='h-4 w-4' />
          </span>
        ),
        onClick: () => navigateAndClose(`/artists/${artist.id}/manage`),
        hidden: () => !isAdminOrDev,
      },
    ],
    [t, handleNavigate, navigateAndClose, isAdminOrDev]
  );

  const getVenueActions = useCallback(
    (venue: Venue): ContextMenuAction<Venue>[] => [
      {
        label: t('globalSearch.contextMenu.view'),
        icon: <Eye className='h-4 w-4' />,
        onClick: () => handleNavigate('venue', venue.id),
      },
      {
        label: t('globalSearch.contextMenu.manage'),
        icon: (
          <span className='flex items-center gap-1'>
            <Key className='h-3 w-3 text-fm-gold' />
            <Settings className='h-4 w-4' />
          </span>
        ),
        onClick: () => navigateAndClose(`/venues/${venue.id}/manage`),
        hidden: () => !isAdminOrDev,
      },
    ],
    [t, handleNavigate, navigateAndClose, isAdminOrDev]
  );

  const getEventActions = useCallback(
    (event: Event): ContextMenuAction<Event>[] => [
      {
        label: t('globalSearch.contextMenu.view'),
        icon: <Eye className='h-4 w-4' />,
        onClick: () => handleNavigate('event', event.id),
      },
      {
        label: t('globalSearch.contextMenu.manage'),
        icon: (
          <span className='flex items-center gap-1'>
            <Key className='h-3 w-3 text-fm-gold' />
            <Settings className='h-4 w-4' />
          </span>
        ),
        onClick: () => navigateAndClose(`/event/${event.id}/manage`),
        hidden: () => !isAdminOrDev,
      },
    ],
    [t, handleNavigate, navigateAndClose, isAdminOrDev]
  );

  const getRecordingActions = useCallback(
    (recording: Recording): ContextMenuAction<Recording>[] => [
      {
        label: t('globalSearch.contextMenu.listenOn', {
          platform: getPlatformDisplayName(recording.platform),
        }),
        icon: <Headphones className='h-4 w-4' />,
        iconPosition: 'right' as const,
        onClick: () => handleOpenRecording(recording.url),
      },
    ],
    [t, getPlatformDisplayName, handleOpenRecording]
  );

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
                        <FmCommonContextMenu
                          key={org.id}
                          actions={getOrganizationActions(org)}
                          data={org}
                        >
                          <button
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
                        </FmCommonContextMenu>
                      ))}
                    </div>
                  )}

                  {/* Users - Admin/Dev only */}
                  {results.users.length > 0 && (
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10 flex items-center gap-1.5'>
                        {t('globalSearch.sections.users')}
                        <Key className='h-3 w-3 text-fm-gold' />
                      </div>
                      {results.users.map(user => (
                        <FmCommonContextMenu
                          key={user.id}
                          actions={getUserActions(user)}
                          data={user}
                        >
                          <button
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
                        </FmCommonContextMenu>
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
                        <FmCommonContextMenu
                          key={artist.id}
                          actions={getArtistActions(artist)}
                          data={artist}
                        >
                          <button
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
                        </FmCommonContextMenu>
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
                        <FmCommonContextMenu
                          key={venue.id}
                          actions={getVenueActions(venue)}
                          data={venue}
                        >
                          <button
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
                        </FmCommonContextMenu>
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
                        <FmCommonContextMenu
                          key={event.id}
                          actions={getEventActions(event)}
                          data={event}
                        >
                          <button
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
                              <p className='text-sm font-medium truncate flex items-center gap-2'>
                                <span className='truncate'>{event.title}</span>
                                {event.status === 'draft' && (
                                  <span className='inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-fm-gold/20 text-fm-gold border border-fm-gold/30 rounded-none uppercase tracking-wide flex-shrink-0'>
                                    <Key className='h-2.5 w-2.5' />
                                    {t('globalSearch.draftBadge')}
                                  </span>
                                )}
                                {event.status === 'test' && (
                                  <span className='inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-none uppercase tracking-wide flex-shrink-0'>
                                    <Key className='h-2.5 w-2.5' />
                                    {t('globalSearch.testBadge')}
                                  </span>
                                )}
                              </p>
                              <p className='text-xs text-muted-foreground truncate'>
                                {new Date(event.date).toLocaleDateString()} •{' '}
                                {event.venue_name}
                              </p>
                            </div>
                          </button>
                        </FmCommonContextMenu>
                      ))}
                    </div>
                  )}

                  {/* Recordings */}
                  {results.recordings.length > 0 && (
                    <div>
                      <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10'>
                        {t('globalSearch.sections.recordings')}
                        <span className='ml-2 text-[10px] font-normal normal-case opacity-70'>
                          {t('globalSearch.opensInNewTab')}
                        </span>
                      </div>
                      {results.recordings.map(recording => (
                        <FmCommonContextMenu
                          key={recording.id}
                          actions={getRecordingActions(recording)}
                          data={recording}
                        >
                          <button
                            onClick={() => handleOpenRecording(recording.url)}
                            className='w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left group'
                          >
                            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                              {recording.cover_art ? (
                                <img
                                  src={recording.cover_art}
                                  alt={recording.name}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <Disc3 className='h-4 w-4 text-muted-foreground' />
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium truncate flex items-center gap-1.5'>
                                {recording.name}
                                <ExternalLink className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                              </p>
                              <p className='text-xs text-muted-foreground truncate'>
                                {recording.artist_name && `${recording.artist_name} • `}
                                <span className='capitalize'>{recording.platform}</span>
                              </p>
                            </div>
                          </button>
                        </FmCommonContextMenu>
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
