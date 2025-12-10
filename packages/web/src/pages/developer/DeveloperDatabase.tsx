import { useEffect, useMemo, useState } from 'react';
import { logger } from '@force-majeure/shared';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import {
  MapPin,
  Database,
  Calendar,
  Trash2,
  Mic2,
  Building2,
  Users,
  RefreshCw,
  Disc3,
} from 'lucide-react';
import { supabase } from '@force-majeure/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventsManagement } from '../admin/EventsManagement';
import { OrganizationsManagement } from '../admin/OrganizationsManagement';
import { UserManagement } from '../admin/UserManagement';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';
import { toast } from 'sonner';
import { artistColumns, venueColumns, recordingColumns } from '../admin/config/adminGridColumns';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@force-majeure/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { refreshAllTableSchemas } from '@/features/data-grid/services/schemaRefresh';
import { FmCommonButton } from '@/components/common/buttons';

type DatabaseTab =
  | 'overview'
  | 'artists'
  | 'events'
  | 'organizations'
  | 'recordings'
  | 'users'
  | 'venues';

export default function DeveloperDatabase() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);

  // Get active tab from URL query string, fallback to 'overview'
  const tabFromUrl = searchParams.get('table') as DatabaseTab | null;
  const validTabs: DatabaseTab[] = ['overview', 'artists', 'events', 'organizations', 'recordings', 'users', 'venues'];
  const activeTab: DatabaseTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Navigation groups configuration - conditionally include admin-only tabs
  const navigationGroups: FmCommonSideNavGroup<DatabaseTab>[] = useMemo(() => {
    const tables: Array<{
      id: DatabaseTab;
      label: string;
      icon: any;
      description: string;
      badge?: React.ReactNode;
    }> = [
      {
        id: 'artists',
        label: 'Artists',
        icon: Mic2,
        description: 'Artist Management',
      },
      {
        id: 'events',
        label: 'Events',
        icon: Calendar,
        description: 'Event Management',
      },
      {
        id: 'recordings',
        label: 'Recordings',
        icon: Disc3,
        description: 'Music Recordings',
      },
      {
        id: 'venues',
        label: 'Venues',
        icon: MapPin,
        description: 'Venue Management',
      },
    ];

    // Add admin-only tabs (alphabetically)
    if (isAdmin) {
      tables.push(
        {
          id: 'organizations',
          label: 'Organizations',
          icon: Building2,
          description: 'Organization Management',
          badge: <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />,
        },
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          description: 'User Management',
          badge: <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />,
        }
      );
    }

    // Sort all tables alphabetically by label
    tables.sort((a, b) => a.label.localeCompare(b.label));

    return [
      {
        label: 'Overview',
        icon: Database,
        items: [
          {
            id: 'overview' as const,
            label: 'Dashboard',
            icon: Database,
            description: 'Database overview and search',
          },
        ],
      },
      {
        label: 'Tables',
        icon: Database,
        items: tables,
      },
    ];
  }, [isAdmin]);

  // Mobile horizontal tabs configuration
  const mobileTabs: MobileHorizontalTab[] = useMemo(() => {
    const baseTabs = [
      { id: 'artists', label: 'Artists', icon: Mic2 },
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'recordings', label: 'Tracks', icon: Disc3 },
      { id: 'venues', label: 'Venues', icon: MapPin },
    ];
    if (isAdmin) {
      baseTabs.push(
        { id: 'organizations', label: 'Orgs', icon: Building2 },
        { id: 'users', label: 'Users', icon: Users }
      );
    }
    return baseTabs;
  }, [isAdmin]);

  // Update URL when tab changes via location state
  useEffect(() => {
    const state = location.state as {
      editEventId?: string;
      editArtistId?: string;
      openTab?: string;
    } | null;

    if (state?.editArtistId) {
      navigate(`?table=artists`, { replace: true });
    } else if (
      state?.openTab &&
      validTabs.includes(state.openTab as DatabaseTab)
    ) {
      navigate(`?table=${state.openTab}`, { replace: true });
    }
  }, [location.state, navigate]);

  // Handler to change tabs and update URL
  const handleTabChange = (tab: DatabaseTab) => {
    navigate(`?table=${tab}`);
  };

  // Fetch artists data
  const { data: artists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ['admin-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, genre, image_url, bio, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch venues data with city join
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('venues')
        .select(
          `
          id, name, address_line_1, address_line_2, city, state, zip_code,
          capacity, image_url, website, created_at, updated_at,
          cities!city_id(name, state)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the city data for easier access
      return data.map((venue: any) => ({
        ...venue,
        city: venue.cities
          ? `${venue.cities.name}, ${venue.cities.state}`
          : null,
      }));
    },
  });

  // Fetch events count for dashboard
  const { data: eventsCount = 0 } = useQuery({
    queryKey: ['events-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch recordings count for dashboard
  const { data: recordingsCount = 0 } = useQuery({
    queryKey: ['recordings-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artist_recordings')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch recordings data with artist join
  const { data: recordings = [], isLoading: recordingsLoading } = useQuery({
    queryKey: ['admin-recordings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_recordings')
        .select(`
          id, artist_id, name, duration, url, cover_art, platform, created_at, updated_at,
          artists!artist_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten artist name for easier access
      return (data ?? []).map((recording: any) => ({
        ...recording,
        artist_name: recording.artists?.name || null,
      }));
    },
  });

  const handleArtistUpdate = async (
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      const { error } = await supabase
        .from('artists')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(
        ['admin-artists'],
        (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(artist =>
            artist.id === row.id
              ? {
                  ...artist,
                  ...updateData,
                  updated_at: new Date().toISOString(),
                }
              : artist
          );
        }
      );

      toast.success('Artist updated');
    } catch (error) {
      logger.error('Error updating artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to update artist');
      throw error;
    }
  };

  const handleArtistCreate = async (newRow: Partial<any>) => {
    const name = typeof newRow.name === 'string' ? newRow.name.trim() : '';
    if (!name) {
      throw new Error('Artist name is required');
    }

    const payload = {
      name,
      genre:
        typeof newRow.genre === 'string' && newRow.genre.trim() !== ''
          ? newRow.genre.trim()
          : null,
      image_url:
        typeof newRow.image_url === 'string' && newRow.image_url.trim() !== ''
          ? newRow.image_url.trim()
          : null,
      bio:
        typeof newRow.bio === 'string' && newRow.bio.trim() !== ''
          ? newRow.bio.trim()
          : null,
    };

    try {
      const { error } = await supabase.from('artists').insert(payload);
      if (error) throw error;

      toast.success('Artist created');
      await queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
    } catch (error) {
      logger.error('Error creating artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to create artist');
      throw error;
    }
  };

  const handleDeleteArtist = async (artist: any) => {
    if (!confirm(`Are you sure you want to delete "${artist.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artist.id);

      if (error) throw error;

      toast.success('Artist deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
    } catch (error) {
      logger.error('Error deleting artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to delete artist');
    }
  };

  const artistContextActions: DataGridAction[] = [
    {
      label: 'Delete Artist',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteArtist,
      variant: 'destructive',
    },
  ];

  // Handle venue updates
  const handleVenueUpdate = async (
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const updateData: any = {};

    // Convert capacity to integer if updating that field
    if (columnKey === 'capacity') {
      const numValue = parseInt(newValue, 10);
      if (isNaN(numValue)) {
        throw new Error('Capacity must be a valid number');
      }
      updateData[columnKey] = numValue;
    } else {
      updateData[columnKey] = newValue;
    }

    const { error } = await (supabase as any)
      .from('venues')
      .update(updateData)
      .eq('id', row.id);

    if (error) throw error;

    // Update local data instead of refetching to maintain sort order
    queryClient.setQueryData(['admin-venues'], (oldData: any[]) => {
      if (!oldData) return oldData;
      return oldData.map(venue =>
        venue.id === row.id
          ? { ...venue, ...updateData, updated_at: new Date().toISOString() }
          : venue
      );
    });
  };


  const handleDeleteVenue = async (venue: any) => {
    if (!confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('venues')
        .delete()
        .eq('id', venue.id);

      if (error) throw error;

      toast.success('Venue deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
    } catch (error) {
      logger.error('Error deleting venue:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to delete venue');
    }
  };

  // Context menu actions for venues
  const venueContextActions: DataGridAction[] = [
    {
      label: 'Delete Venue',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteVenue,
      variant: 'destructive',
    },
  ];

  // Handle recording updates
  const handleRecordingUpdate = async (
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      const { error } = await supabase
        .from('artist_recordings')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(
        ['admin-recordings'],
        (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(recording =>
            recording.id === row.id
              ? {
                  ...recording,
                  ...updateData,
                  updated_at: new Date().toISOString(),
                }
              : recording
          );
        }
      );

      toast.success('Recording updated');
    } catch (error) {
      logger.error('Error updating recording:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to update recording');
      throw error;
    }
  };

  const handleDeleteRecording = async (recording: any) => {
    if (!confirm(`Are you sure you want to delete "${recording.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('artist_recordings')
        .delete()
        .eq('id', recording.id);

      if (error) throw error;

      toast.success('Recording deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
    } catch (error) {
      logger.error('Error deleting recording:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to delete recording');
    }
  };

  const recordingContextActions: DataGridAction[] = [
    {
      label: 'Delete Recording',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteRecording,
      variant: 'destructive',
    },
  ];

  // Calculate statistics for current data
  const getCurrentData = () => {
    if (activeTab === 'artists') return artists;
    if (activeTab === 'venues') return venues;
    if (activeTab === 'recordings') return recordings;
    if (activeTab === 'events') return []; // Events data is managed in EventsManagement component
    if (activeTab === 'organizations') return [];
    return [];
  };

  const calculateCompleteness = (data: any[]) => {
    if (!data.length) return 0;

    let totalFields = 0;
    let filledFields = 0;

    data.forEach(record => {
      const fields = Object.entries(record);
      fields.forEach(([key, value]) => {
        // Skip internal fields
        if (['id', 'created_at', 'updated_at'].includes(key)) return;
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
        }
      });
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  const currentData = getCurrentData();
  const completeness = calculateCompleteness(currentData);

  // Schema refresh handler
  const handleSchemaRefresh = async () => {
    setIsRefreshingSchema(true);
    try {
      const result = await refreshAllTableSchemas();
      if (result.success) {
        toast.success(`Schema refreshed successfully! ${result.tablesRefreshed} tables updated.`);
      } else {
        toast.error(result.error || 'Failed to refresh schema');
      }
    } catch (error) {
      logger.error('Error refreshing schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DeveloperDatabase',
        details: {},
      });
      toast.error('Failed to refresh schema');
    } finally {
      setIsRefreshingSchema(false);
    }
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
    >
      {/* Mobile horizontal tabs */}
      <MobileHorizontalTabs
        tabs={mobileTabs}
        activeTab={activeTab}
        onTabChange={tab => handleTabChange(tab as DatabaseTab)}
      />

      <div className='max-w-full'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='flex flex-col items-center justify-center min-h-[60vh]'>
            {/* Schema Refresh Button */}
            <div className='w-full max-w-4xl mb-6 flex justify-end'>
              <FmCommonButton
                onClick={handleSchemaRefresh}
                disabled={isRefreshingSchema}
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                className={isRefreshingSchema ? '[&_svg]:animate-spin' : ''}
              >
                {isRefreshingSchema ? 'Refreshing Schema...' : 'Refresh Schema'}
              </FmCommonButton>
            </div>

            {/* Stats Groups in Columns */}
            <div className='w-full max-w-5xl mb-12'>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Artists
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {artists.length}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Venues
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {venues.length}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Events
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {eventsCount}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Recordings
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {recordingsCount}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Complete Data
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {completeness}%
                  </div>
                </div>
              </div>
            </div>

            {/* Centered Search */}
            <div className='w-full max-w-2xl'>
              <DatabaseNavigatorSearch />
            </div>
          </div>
        )}

        {activeTab === 'artists' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Artists Management
              </h1>
              <p className='text-muted-foreground'>
                Manage artist profiles, genres, and metadata.
              </p>
            </div>

            <FmConfigurableDataGrid
              gridId='dev-artists'
              data={artists}
              columns={artistColumns}
              contextMenuActions={artistContextActions}
              loading={artistsLoading}
              pageSize={15}
              onUpdate={handleArtistUpdate}
              onCreate={handleArtistCreate}
              resourceName='Artist'
              createButtonLabel='Add Artist'
              onCreateButtonClick={() => navigate('/artists/create')}
            />
          </div>
        )}

        {activeTab === 'organizations' && <OrganizationsManagement />}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'venues' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Venues Management
              </h1>
              <p className='text-muted-foreground'>
                Manage venue locations, capacities, and details.
              </p>
            </div>

            <FmConfigurableDataGrid
              gridId='dev-venues'
              data={venues}
              columns={venueColumns}
              contextMenuActions={venueContextActions}
              loading={venuesLoading}
              pageSize={15}
              onUpdate={handleVenueUpdate}
              resourceName='Venue'
              createButtonLabel='Add Venue'
              onCreateButtonClick={() => navigate('/venues/create')}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <EventsManagement />
        )}

        {activeTab === 'recordings' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Recordings Management
              </h1>
              <p className='text-muted-foreground'>
                Manage artist recordings from Spotify and SoundCloud.
              </p>
            </div>

            <FmConfigurableDataGrid
              gridId='dev-recordings'
              data={recordings}
              columns={recordingColumns}
              contextMenuActions={recordingContextActions}
              loading={recordingsLoading}
              pageSize={15}
              onUpdate={handleRecordingUpdate}
              resourceName='Recording'
            />
          </div>
        )}
      </div>
    </SideNavbarLayout>
  );
}
