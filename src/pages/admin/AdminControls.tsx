import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import { FmUserDataGrid } from '@/components/ui/FmUserDataGrid';
import { FmCommonDataGrid, DataGridColumn } from '@/components/ui/FmCommonDataGrid';
import { Settings, Users, Sliders, MapPin, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
                      'cursor-pointer',
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold'
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
                      'cursor-pointer',
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold'
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

  // Fetch venues data
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Define columns for venues grid
  const venueColumns: DataGridColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
      filterable: true,
    },
    {
      key: 'address',
      label: 'Address',
      sortable: true,
      filterable: true,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (value) => value ? value.toLocaleString() : '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <>
      <Navigation />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full pt-16">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 pt-6 pb-6 px-6">
            <div className="max-w-full">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-6 w-6 text-fm-gold" />
                <h1 className="text-3xl font-canela font-bold">Admin Controls</h1>
              </div>
              <p className="text-muted-foreground mb-6">
                Manage users and application settings
              </p>

              <DecorativeDivider
                marginTop="mt-0"
                marginBottom="mb-6"
                lineWidth="w-32"
                opacity={0.5}
              />

              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-canela font-semibold">User Management</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      View and manage all registered users, their roles, and permissions
                    </p>
                  </div>
                  <FmUserDataGrid />
                </div>
              )}

              {activeTab === 'venues' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-canela font-semibold">Venue Management</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      View and manage all venues in the system
                    </p>
                  </div>
                  <FmCommonDataGrid
                    data={venues}
                    columns={venueColumns}
                    loading={venuesLoading}
                    pageSize={15}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-canela font-semibold">Site Settings</h2>
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
