import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Music, MapPin, Calendar, User, Eye, Pencil, Trash2, X, Clock } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { supabase } from '@/shared';
import { useDebounce } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { logger } from '@/shared';
import { FmCommonContextMenu, ContextMenuAction } from '@/components/common/modals/FmCommonContextMenu';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { toast } from 'sonner';

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

// Entity type configuration for routes and display
type EntityType = 'organization' | 'user' | 'artist' | 'venue' | 'event';

interface EntityConfig {
  detailRoute: (id: string) => string;
  editRoute: (id: string) => string;
  tableName: string;
  displayName: string;
  icon: typeof Building2;
}

const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  organization: {
    detailRoute: (id) => `/admin/organizations/${id}`,
    editRoute: (id) => `/admin/organizations/${id}`,
    tableName: 'organizations',
    displayName: 'Organization',
    icon: Building2,
  },
  user: {
    detailRoute: (id) => `/admin/users/${id}`,
    editRoute: (id) => `/admin/users/${id}`,
    tableName: 'profiles',
    displayName: 'User',
    icon: User,
  },
  artist: {
    detailRoute: (id) => `/artists/${id}`,
    editRoute: (id) => `/artists/${id}/manage`,
    tableName: 'artists',
    displayName: 'Artist',
    icon: Music,
  },
  venue: {
    detailRoute: (id) => `/venues/${id}`,
    editRoute: (id) => `/venues/${id}/manage`,
    tableName: 'venues',
    displayName: 'Venue',
    icon: MapPin,
  },
  event: {
    detailRoute: (id) => `/event/${id}`,
    editRoute: (id) => `/event/${id}/manage`,
    tableName: 'events',
    displayName: 'Event',
    icon: Calendar,
  },
};

// Recent records storage
const RECENT_RECORDS_KEY = 'fm_database_recent_records';
const MAX_RECENT_RECORDS = 10;

interface RecentRecord {
  id: string;
  type: EntityType;
  name: string;
  imageUrl?: string | null;
  visitedAt: number;
}

function getRecentRecords(): RecentRecord[] {
  try {
    const stored = localStorage.getItem(RECENT_RECORDS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.warn('Failed to parse recent records', { error });
  }
  return [];
}

function saveRecentRecord(record: Omit<RecentRecord, 'visitedAt'>): void {
  try {
    const records = getRecentRecords();
    const filtered = records.filter(r => !(r.id === record.id && r.type === record.type));
    const updated = [{ ...record, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT_RECORDS);
    localStorage.setItem(RECENT_RECORDS_KEY, JSON.stringify(updated));
  } catch (error) {
    logger.warn('Failed to save recent record', { error });
  }
}

function removeRecentRecord(id: string, type: EntityType): void {
  try {
    const records = getRecentRecords();
    const filtered = records.filter(r => !(r.id === id && r.type === type));
    localStorage.setItem(RECENT_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    logger.warn('Failed to remove recent record', { error });
  }
}

// Generic search result item for context menu
interface SearchResultItem {
  id: string;
  type: EntityType;
  name: string;
  imageUrl?: string | null;
}

/**
 * Inline database navigator search component
 * Designed to be embedded within the Database Manager toolbar
 */
export function DatabaseNavigatorSearch() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
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
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    item: SearchResultItem | null;
    isDeleting: boolean;
  }>({
    open: false,
    item: null,
    isDeleting: false,
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  // Load recent records on mount
  useEffect(() => {
    setRecentRecords(getRecentRecords());
  }, []);

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
        title: tToast('admin.databaseSearchFailed'),
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

  const showRecentRecords = useMemo(() => {
    return searchQuery.trim().length === 0 && recentRecords.length > 0;
  }, [searchQuery, recentRecords]);

  // Navigate to detail page and save to recent records
  const handleNavigateToDetails = useCallback((item: SearchResultItem) => {
    const config = ENTITY_CONFIG[item.type];
    saveRecentRecord({
      id: item.id,
      type: item.type,
      name: item.name,
      imageUrl: item.imageUrl,
    });
    setRecentRecords(getRecentRecords());
    setSearchQuery('');
    navigate(config.detailRoute(item.id));
  }, [navigate]);

  // Navigate to edit page and save to recent records
  const handleNavigateToEdit = useCallback((item: SearchResultItem) => {
    const config = ENTITY_CONFIG[item.type];
    saveRecentRecord({
      id: item.id,
      type: item.type,
      name: item.name,
      imageUrl: item.imageUrl,
    });
    setRecentRecords(getRecentRecords());
    setSearchQuery('');
    navigate(config.editRoute(item.id));
  }, [navigate]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((item: SearchResultItem) => {
    setDeleteConfirm({
      open: true,
      item,
      isDeleting: false,
    });
  }, []);

  // Perform deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm.item) return;

    const { id, type, name } = deleteConfirm.item;
    const config = ENTITY_CONFIG[type];

    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));

    try {
      const { error } = await (supabase as any)
        .from(config.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from recent records
      removeRecentRecord(id, type);
      setRecentRecords(getRecentRecords());

      // Remove from current search results
      setResults(prev => {
        const key = `${type}s` as keyof SearchResults;
        return {
          ...prev,
          [key]: (prev[key] as any[]).filter((item: any) => item.id !== id),
        };
      });

      toast.success(t('databaseSearch.toasts.deleted', { entity: t(`databaseSearch.entityDisplayNames.${type}`) }), {
        description: t('databaseSearch.toasts.deletedDescription', { name }),
      });
    } catch (error) {
      handleError(error, {
        title: t('databaseSearch.toasts.deleteFailed', { entity: t(`databaseSearch.entityTypes.${type}`) }),
        context: `Deleting ${name}`,
      });
    } finally {
      setDeleteConfirm({ open: false, item: null, isDeleting: false });
    }
  }, [deleteConfirm.item]);

  // Build context menu actions for a search result item
  const getContextMenuActions = useCallback((item: SearchResultItem): ContextMenuAction<SearchResultItem>[] => {
    return [
      {
        label: t('databaseSearch.contextMenu.goToDetails'),
        icon: <Eye className='h-4 w-4' />,
        onClick: () => handleNavigateToDetails(item),
      },
      {
        label: t('databaseSearch.contextMenu.edit', { entity: t(`databaseSearch.entityTypes.${item.type}`) }),
        icon: <Pencil className='h-4 w-4' />,
        onClick: () => handleNavigateToEdit(item),
        separator: true,
      },
      {
        label: t('databaseSearch.contextMenu.delete', { entity: t(`databaseSearch.entityTypes.${item.type}`) }),
        icon: <Trash2 className='h-4 w-4' />,
        onClick: () => handleDeleteClick(item),
        variant: 'destructive',
        separator: true,
      },
      {
        label: t('buttons.cancel'),
        icon: <X className='h-4 w-4' />,
        onClick: () => {},
      },
    ];
  }, [handleNavigateToDetails, handleNavigateToEdit, handleDeleteClick]);

  // Render a search result item with context menu
  const renderResultItem = useCallback((
    item: SearchResultItem,
    imageUrl: string | null | undefined,
    subtitle?: string
  ) => {
    const config = ENTITY_CONFIG[item.type];
    const IconComponent = config.icon;

    return (
      <FmCommonContextMenu
        key={item.id}
        actions={getContextMenuActions(item)}
        data={item}
      >
        <button
          onClick={() => handleNavigateToDetails(item)}
          className='w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left'
        >
          <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <IconComponent className='h-4 w-4 text-muted-foreground' />
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>{item.name}</p>
            {subtitle && (
              <p className='text-xs text-muted-foreground truncate'>
                {subtitle}
              </p>
            )}
          </div>
        </button>
      </FmCommonContextMenu>
    );
  }, [getContextMenuActions, handleNavigateToDetails]);

  return (
    <div className='w-full'>
      {/* Description */}
      <div className='mb-3'>
        <p className='text-sm text-muted-foreground'>
          {t('databaseSearch.description')}
        </p>
      </div>

      {/* Search Input */}
      <div className='relative mb-4'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          type='text'
          placeholder={t('databaseSearch.placeholder')}
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

      {/* Recent Records - Show when query is empty */}
      {showRecentRecords && (
        <div className='border rounded-md max-h-[400px] overflow-y-auto bg-background/50'>
          <div className='p-2'>
            <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2 flex items-center gap-2'>
              <Clock className='h-3 w-3' />
              {t('databaseSearch.recentRecords')}
            </h3>
            {recentRecords.map(record =>
              renderResultItem(
                {
                  id: record.id,
                  type: record.type,
                  name: record.name,
                  imageUrl: record.imageUrl,
                },
                record.imageUrl,
                t(`databaseSearch.entityDisplayNames.${record.type}`)
              )
            )}
          </div>
        </div>
      )}

      {/* Results - Inline Display */}
      {searchQuery.trim().length >= 2 && hasResults && (
        <div className='border rounded-md max-h-[400px] overflow-y-auto bg-background/50'>
          {/* Organizations */}
          {results.organizations.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                {t('databaseSearch.sections.organizations')}
              </h3>
              {results.organizations.map(org =>
                renderResultItem(
                  { id: org.id, type: 'organization', name: org.name, imageUrl: org.logo_url },
                  org.logo_url
                )
              )}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                {t('databaseSearch.sections.users')}
              </h3>
              {results.users.map(user =>
                renderResultItem(
                  {
                    id: user.id,
                    type: 'user',
                    name: user.display_name || user.full_name || t('databaseSearch.unknownUser'),
                    imageUrl: user.avatar_url,
                  },
                  user.avatar_url,
                  user.email
                )
              )}
            </div>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                {t('databaseSearch.sections.artists')}
              </h3>
              {results.artists.map(artist =>
                renderResultItem(
                  { id: artist.id, type: 'artist', name: artist.name, imageUrl: artist.image_url },
                  artist.image_url
                )
              )}
            </div>
          )}

          {/* Venues */}
          {results.venues.length > 0 && (
            <div className='p-2 border-b'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                {t('databaseSearch.sections.venues')}
              </h3>
              {results.venues.map(venue =>
                renderResultItem(
                  { id: venue.id, type: 'venue', name: venue.name, imageUrl: venue.image_url },
                  venue.image_url
                )
              )}
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div className='p-2'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                {t('databaseSearch.sections.events')}
              </h3>
              {results.events.map(event =>
                renderResultItem(
                  { id: event.id, type: 'event', name: event.title, imageUrl: event.hero_image },
                  event.hero_image,
                  `${event.date ? new Date(event.date).toLocaleDateString() : t('databaseSearch.tba')} • ${event.venue_name || t('databaseSearch.tba')}`
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {searchQuery.trim().length >= 2 && !hasResults && !isSearching && (
        <div className='border rounded-md p-4 bg-background/50'>
          <p className='text-sm text-muted-foreground text-center'>
            {t('databaseSearch.noResults', { query: searchQuery })}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <FmCommonConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm({ open: false, item: null, isDeleting: false });
          }
        }}
        title={deleteConfirm.item
          ? t('databaseSearch.deleteDialog.title', { entity: t(`databaseSearch.entityTypes.${deleteConfirm.item.type}`) })
          : ''
        }
        description={
          deleteConfirm.item
            ? t('databaseSearch.deleteDialog.description', { name: deleteConfirm.item.name })
            : ''
        }
        confirmText={t('actions.delete')}
        cancelText={t('buttons.cancel')}
        onConfirm={handleConfirmDelete}
        variant='destructive'
        isLoading={deleteConfirm.isDeleting}
      />
    </div>
  );
}
