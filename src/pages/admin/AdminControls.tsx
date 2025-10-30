import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmUserDataGrid } from '@/components/ui/data/FmUserDataGrid';
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from '@/components/ui/data/FmCommonDataGrid';
import { FmEditVenueButton } from '@/components/ui/buttons/FmEditVenueButton';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/ui/navigation/FmCommonSideNav';
import { Users, Sliders, MapPin, Database, Calendar, Edit, Trash2, Settings, Code } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminFeesSection } from '@/components/admin/AdminFeesSection';
import { DevToolsManagement } from '@/components/admin/DevToolsManagement';
import { EventsManagement } from './EventsManagement';
import { toast } from 'sonner';

type AdminTab = 'users' | 'venues' | 'events' | 'settings' | 'devtools';

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
        { id: 'users', label: 'Users', icon: Users, description: 'Manage user accounts' },
        { id: 'venues', label: 'Venues', icon: MapPin, description: 'Manage venue locations' },
        { id: 'events', label: 'Events', icon: Calendar, description: 'Manage events' },
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
    const state = location.state as { editEventId?: string; openTab?: string } | null;
    if (state?.openTab) {
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

  // Define columns for venues grid
  const venueColumns: DataGridColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      editable: true,
    },
    {
      key: 'city_id',
      label: 'City',
      sortable: true,
      filterable: true,
      editable: true,
      readonly: true, // City shown but edit via form only
      isRelation: true,
      render: (_value, row) => row.city || '-',
    },
    {
      key: 'address',
      label: 'Address',
      sortable: true,
      filterable: true,
      editable: true,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      editable: true,
      render: (value) => value ? value.toLocaleString() : '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      readonly: true,
      render: (value) => new Date(value).toLocaleDateString(),
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
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="h-6 w-6 text-fm-gold" />
                  <h1 className="text-3xl font-canela font-bold">{getTabTitle()}</h1>
                </div>

                {activeTab !== 'settings' && activeTab !== 'devtools' && (
                  <div className="flex gap-4 mb-6">
                    <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]">
                      <div className="text-2xl font-bold text-foreground">{totalRecords}</div>
                      <div className="text-xs text-muted-foreground">Total Records</div>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]">
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

              {activeTab === 'users' && (
                <FmUserDataGrid />
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
                    <h3 className="text-lg font-canela font-semibold mb-2">Feature Flags</h3>
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
                    <h3 className="text-lg font-canela font-semibold mb-2">Ticketing Fees</h3>
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
                    <h3 className="text-lg font-canela font-semibold mb-2">Dev Toolbar Sections</h3>
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
