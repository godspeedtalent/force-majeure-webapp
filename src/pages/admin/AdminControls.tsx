import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import { FmUserDataGrid } from '@/components/ui/FmUserDataGrid';
import { Settings, Users, Sliders } from 'lucide-react';
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

type AdminTab = 'users' | 'settings';

function AdminSidebar({ activeTab, setActiveTab }: { activeTab: AdminTab; setActiveTab: (tab: AdminTab) => void }) {
  const { open } = useSidebar();

  const tabs = [
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'settings' as AdminTab, label: 'Site Settings', icon: Sliders },
  ];

  return (
    <Sidebar className="border-r border-white/20 bg-black/40" collapsible="icon">
      <SidebarContent className="pt-4">
        <div className="px-2 mb-4">
          <SidebarTrigger className="hover:bg-fm-gold/20 transition-colors" />
        </div>
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-white/70 px-4">
              Admin Tools
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map((tab) => (
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
