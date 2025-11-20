import { useState, useEffect, useMemo } from 'react';
import { logger } from '@/shared/services/logger';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import {
  MapPin,
  Database,
  Calendar,
  Edit,
  Trash2,
  Mic2,
  Building2,
  Users,
} from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventsManagement } from '../admin/EventsManagement';
import { OrganizationsManagement } from '../admin/OrganizationsManagement';
import { UserManagement } from '../admin/UserManagement';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';
import { toast } from 'sonner';
import { formatHeader } from '@/shared/utils/styleUtils';
import { artistColumns, venueColumns } from '../admin/config/adminGridColumns';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { AdminLockIndicator } from '@/components/common/indicators';

type DatabaseTab =
  | 'overview'
  | 'artists'
  | 'events'
  | 'organizations'
  | 'users'
  | 'venues';

export default function DeveloperDatabase() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);

  // Get active tab from URL query string, fallback to 'overview'
  const tabFromUrl = searchParams.get('table') as DatabaseTab | null;
  const validTabs: DatabaseTab[] = ['overview', 'artists', 'events', 'organizations', 'users', 'venues'];
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
          *,
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
      logger.error('Error updating artist:', error);
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
      logger.error('Error creating artist:', error);
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
      logger.error('Error deleting artist:', error);
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
      logger.error('Error deleting venue:', error);
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

  // Calculate statistics for current data
  const getCurrentData = () => {
    if (activeTab === 'artists') return artists;
    if (activeTab === 'venues') return venues;
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
  const totalRecords = currentData.length;
  const completeness = calculateCompleteness(currentData);

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
            {/* Stats Groups in Columns */}
            <div className='w-full max-w-4xl mb-12'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
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
                    Total Records
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {totalRecords}
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
          <EventsManagement
            initialEditEventId={(location.state as any)?.editEventId}
          />
        )}
      </div>
    </SideNavbarLayout>
  );
}
