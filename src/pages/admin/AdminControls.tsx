import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmUserDataGrid } from '@/components/common/data/FmUserDataGrid';
import { FmCommonDataGrid, DataGridAction } from '@/components/common/data/FmCommonDataGrid';
import { FmEditVenueButton } from '@/components/common/buttons/FmEditVenueButton';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { Users, Sliders, MapPin, Database, Calendar, Edit, Trash2, Settings, Code, Mic2, Building2 } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FeatureToggleSection } from '@/components/devtools/FeatureToggleSection';
import { AdminFeesSection } from '@/components/admin/AdminFeesSection';
import { DevToolsManagement } from '@/components/admin/DevToolsManagement';
import { EventsManagement } from './EventsManagement';
import { OrganizationsManagement } from './OrganizationsManagement';
import { toast } from 'sonner';
import { formatHeader } from '@/shared/utils/styleUtils';
import { artistColumns, venueColumns } from './config/adminGridColumns';

type AdminTab = 'artists' | 'events' | 'users' | 'venues' | 'organizations' | 'settings' | 'devtools';

export default function AdminControls() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<AdminTab>[] = [
    {
      label: 'Database',
      icon: Database,
      items: [
        { id: 'artists', label: 'Artists', icon: Mic2, description: 'Manage artist profiles' },
        { id: 'events', label: 'Events', icon: Calendar, description: 'Manage events' },
        { id: 'organizations', label: 'Organizations', icon: Building2, description: 'Manage organizations' },
        { id: 'users', label: 'Users', icon: Users, description: 'Manage user accounts' },
        { id: 'venues', label: 'Venues', icon: MapPin, description: 'Manage venue locations' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { id: 'settings', label: 'Site Settings', icon: Sliders, description: 'Configure site settings' },
        { id: 'devtools', label: 'Developer Tools', icon: Code, description: 'Toggle dev environment features' },
      ],
    },
  ];

  // Handle navigation from Event List dev tool
  useEffect(() => {
    const state = location.state as {
      editEventId?: string;
      editArtistId?: string;
      openTab?: string;
    } | null;

    if (state?.editArtistId) {
      setActiveTab('artists');
    } else if (state?.openTab) {
      setActiveTab(state.openTab as AdminTab);
    }
  }, [location.state]);

  // Fetch users data
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-users', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      return data.users || [];
    },
  });

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
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          cities!city_id(name, state)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Flatten the city data for easier access
      return data.map(venue => ({
        ...venue,
        city: venue.cities ? `${venue.cities.name}, ${venue.cities.state}` : null,
      }));
    },
  });

  const handleArtistUpdate = async (row: any, columnKey: string, newValue: any) => {
    const normalizedValue = typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      const { error } = await supabase
        .from('artists')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(['admin-artists'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(artist =>
          artist.id === row.id
            ? { ...artist, ...updateData, updated_at: new Date().toISOString() }
            : artist
        );
      });

      toast.success('Artist updated');
    } catch (error) {
      console.error('Error updating artist:', error);
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
      console.error('Error creating artist:', error);
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
      console.error('Error deleting artist:', error);
      toast.error('Failed to delete artist');
    }
  };

  const artistContextActions: DataGridAction[] = [
    {
      label: 'Delete Artist',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteArtist,
      variant: 'destructive',
    },
  ];

  // Handle venue updates
  const handleVenueUpdate = async (row: any, columnKey: string, newValue: any) => {
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

    const { error } = await supabase
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

  const handleVenueUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
    setEditingVenueId(null);
  };

  const handleDeleteVenue = async (venue: any) => {
    if (!confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venue.id);

      if (error) throw error;

      toast.success('Venue deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Failed to delete venue');
    }
  };

  // Context menu actions for venues
  const venueContextActions: DataGridAction[] = [
    {
      label: 'Edit Venue',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => setEditingVenueId(row.id),
    },
    {
      label: 'Delete Venue',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteVenue,
      variant: 'destructive',
    },
  ];

  // Calculate statistics for current data
  const getCurrentData = () => {
    if (activeTab === 'artists') return artists;
    if (activeTab === 'users') return users;
    if (activeTab === 'venues') return venues;
    if (activeTab === 'events') return []; // Events data is managed in EventsManagement component
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

  const getTabTitle = () => {
    if (activeTab === 'artists') return 'Artists';
    if (activeTab === 'users') return 'Users';
    if (activeTab === 'venues') return 'Venues';
    if (activeTab === 'events') return 'Events';
    if (activeTab === 'settings') return 'Site Settings';
    if (activeTab === 'devtools') return 'Developer Tools';
    return 'Admin Controls';
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={setActiveTab}
    >
      <div className="max-w-full">
              <div className="mb-[20px]">
                <div className="flex items-center gap-[10px] mb-[20px]">
                  <Settings className="h-6 w-6 text-fm-gold" />
                  <h1 className="text-3xl font-canela">{formatHeader(getTabTitle())}</h1>
                </div>

                {activeTab !== 'settings' && activeTab !== 'devtools' && (
                  <div className="flex gap-[20px] mb-[20px]">
                    <div className="bg-muted/30 border border-border rounded-none px-[20px] py-[10px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]">
                      <div className="text-2xl font-bold text-foreground">{totalRecords}</div>
                      <div className="text-xs text-muted-foreground">Total Records</div>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-none px-[20px] py-[10px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]">
                      <div className="text-2xl font-bold text-foreground">{completeness}%</div>
                      <div className="text-xs text-muted-foreground">Complete Data</div>
                    </div>
                  </div>
                )}
              </div>

              <DecorativeDivider
                marginTop="mt-0"
                marginBottom="mb-6"
                lineWidth="w-32"
                opacity={0.5}
              />

              {activeTab === 'artists' && (
                <FmCommonDataGrid
                  data={artists}
                  columns={artistColumns}
                  contextMenuActions={artistContextActions}
                  loading={artistsLoading}
                  pageSize={15}
                  onUpdate={handleArtistUpdate}
                  onCreate={handleArtistCreate}
                  resourceName="Artist"
                  createButtonLabel="Add Artist"
                />
              )}

              {activeTab === 'users' && (
                <FmUserDataGrid />
              )}

              {activeTab === 'organizations' && (
                <OrganizationsManagement />
              )}

              {activeTab === 'venues' && (
                <>
                  <FmCommonDataGrid
                    data={venues}
                    columns={venueColumns}
                    contextMenuActions={venueContextActions}
                    loading={venuesLoading}
                    pageSize={15}
                    onUpdate={handleVenueUpdate}
                    resourceName="Venue"
                  />
                  
                  {editingVenueId && (
                    <FmEditVenueButton
                      venueId={editingVenueId}
                      onVenueUpdated={handleVenueUpdated}
                      autoOpen={true}
                    />
                  )}
                </>
              )}

              {activeTab === 'events' && (
                <EventsManagement initialEditEventId={(location.state as any)?.editEventId} />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-canela font-semibold mb-2">{formatHeader('Feature Flags')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Control feature availability across different environments
                    </p>
                    <FeatureToggleSection />
                  </div>

                  <DecorativeDivider
                    marginTop="mt-4"
                    marginBottom="mb-4"
                    lineWidth="w-24"
                    opacity={0.3}
                  />

                  <div>
                    <h3 className="text-lg font-canela font-semibold mb-2">{formatHeader('Ticketing Fees')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Configure site-wide fees and taxes applied to all ticket purchases
                    </p>
                    <AdminFeesSection />
                  </div>
                </div>
              )}

              {activeTab === 'devtools' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-canela font-semibold mb-2">{formatHeader('Dev Toolbar Sections')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Control which sections appear in the developer toolbar for testing
                    </p>
                    <DevToolsManagement />
                  </div>
                </div>
              )}
          </div>
    </SideNavbarLayout>
  );
}
