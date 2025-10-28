import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import { FmUserDataGrid } from '@/components/ui/FmUserDataGrid';
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from '@/components/ui/FmCommonDataGrid';
import { FmEditVenueButton } from '@/components/ui/FmEditVenueButton';
import { TopographicBackground } from '@/components/ui/TopographicBackground';
import { Settings, Users, Sliders, MapPin, Database, Calendar, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminFeesSection } from '@/components/admin/AdminFeesSection';
import { EventsManagement } from './EventsManagement';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/shared/utils/utils';

type AdminTab = 'users' | 'venues' | 'events' | 'settings';

function AdminSidebar({ activeTab, setActiveTab }: { activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) {
  const { open, toggleSidebar } = useSidebar();

  const databaseTabs = [
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'venues' as AdminTab, label: 'Venues', icon: MapPin },
    { id: 'events' as AdminTab, label: 'Events', icon: Calendar },
  ];

  const settingsTabs = [
    { id: 'settings' as AdminTab, label: 'Site Settings', icon: Sliders },
  ];

  return (
    <Sidebar className="border-r border-white/20 bg-black/40" collapsible="icon">
      <SidebarContent className="pt-4">
        <div className="px-2 mb-4">
          <SidebarTrigger className="hover:bg-fm-gold/20 transition-colors" />
        </div>

        {/* Database Group */}
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel
              className="text-white/90 px-4 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors rounded-md text-base font-semibold mb-1"
              onClick={toggleSidebar}
            >
              <Database className="h-4 w-4" />
              Database
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {databaseTabs.map((tab) => (
                <SidebarMenuItem key={tab.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      open ? 'justify-start pl-4' : 'justify-center',
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold hover:bg-fm-gold/30'
                    )}
                    tooltip={tab.label}
                  >
                    <tab.icon className="h-4 w-4" />
                    {open && <span className="ml-3">{tab.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        {open ? (
          <div className="px-4 my-2">
            <div className="h-px bg-border/50" />
          </div>
        ) : (
          <div className="px-2 my-2">
            <div className="h-px bg-border/50" />
          </div>
        )}

        {/* Settings Group */}
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel
              className="text-white/90 px-4 cursor-pointer hover:bg-white/5 transition-colors rounded-md text-base font-semibold mb-1"
              onClick={toggleSidebar}
            >
              Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsTabs.map((tab) => (
                <SidebarMenuItem key={tab.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      open ? 'justify-start pl-4' : 'justify-center',
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold hover:bg-fm-gold/30'
                    )}
                    tooltip={tab.label}
                  >
                    <tab.icon className="h-4 w-4" />
                    {open && <span className="ml-3">{tab.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminControls() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
    return 'Admin Controls';
  };

  return (
    <>
      <Navigation />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full pt-16">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 pt-6 pb-6 px-6 relative overflow-hidden">
            {/* Topographic texture background - mirrored for seamless pattern */}
            <TopographicBackground />
            <div className="max-w-full relative z-10">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="h-6 w-6 text-fm-gold" />
                  <h1 className="text-3xl font-canela font-bold">{getTabTitle()}</h1>
                </div>

                {activeTab !== 'settings' && (
                  <div className="flex gap-4 mb-6">
                    <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
                      <div className="text-2xl font-bold text-foreground">{totalRecords}</div>
                      <div className="text-xs text-muted-foreground">Total Records</div>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
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
                <EventsManagement />
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
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
