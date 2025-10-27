import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import { FmUserDataGrid } from '@/components/ui/FmUserDataGrid';
import { FmCommonDataGrid, DataGridColumn } from '@/components/ui/FmCommonDataGrid';
import { Settings, Users, Sliders, MapPin, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

type AdminTab = 'users' | 'venues' | 'settings';

function AdminSidebar({ activeTab, setActiveTab }: { activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) {
  const { open } = useSidebar();

  const databaseTabs = [
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'venues' as AdminTab, label: 'Venues', icon: MapPin },
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
            <SidebarGroupLabel className="text-white/70 px-4 flex items-center gap-2">
              <Database className="h-3 w-3" />
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
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold hover:bg-fm-gold/30'
                    )}
                    tooltip={tab.label}
                  >
                    <tab.icon className="h-4 w-4" />
                    {open && <span>{tab.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-white/70 px-4">
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
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold hover:bg-fm-gold/30'
                    )}
                    tooltip={tab.label}
                  >
                    <tab.icon className="h-4 w-4" />
                    {open && <span>{tab.label}</span>}
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

    // Refetch venues to show updated data
    await queryClient.refetchQueries({ queryKey: ['admin-venues'] });
  };

  // Calculate statistics for current data
  const getCurrentData = () => {
    if (activeTab === 'users') return users;
    if (activeTab === 'venues') return venues;
    return [];
  };

  const calculateIncompleteness = (data: any[]) => {
    if (!data.length) return 0;
    
    let totalFields = 0;
    let emptyFields = 0;
    
    data.forEach(record => {
      const fields = Object.entries(record);
      fields.forEach(([key, value]) => {
        // Skip internal fields
        if (['id', 'created_at', 'updated_at'].includes(key)) return;
        totalFields++;
        if (value === null || value === undefined || value === '') {
          emptyFields++;
        }
      });
    });
    
    return totalFields > 0 ? Math.round((emptyFields / totalFields) * 100) : 0;
  };

  const currentData = getCurrentData();
  const totalRecords = currentData.length;
  const incompleteness = calculateIncompleteness(currentData);

  const getTabTitle = () => {
    if (activeTab === 'users') return 'Users';
    if (activeTab === 'venues') return 'Venues';
    if (activeTab === 'settings') return 'Site Settings';
    return 'Admin Controls';
  };

  return (
    <>
      <Navigation />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full pt-16">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 pt-6 pb-6 px-6">
            <div className="max-w-full">
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
                      <div className="text-2xl font-bold text-foreground">{incompleteness}%</div>
                      <div className="text-xs text-muted-foreground">Incomplete Data</div>
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
                <FmCommonDataGrid
                  data={venues}
                  columns={venueColumns}
                  loading={venuesLoading}
                  pageSize={15}
                  onUpdate={handleVenueUpdate}
                  resourceName="Venue"
                />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Site configuration options coming soon...
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
