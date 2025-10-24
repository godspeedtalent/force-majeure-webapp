import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { DecorativeDivider } from '@/components/DecorativeDivider';
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
} from '@/components/ui/sidebar';
import { cn } from '@/shared/utils/utils';

type AdminTab = 'users' | 'settings';

export default function AdminControls() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const tabs = [
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'settings' as AdminTab, label: 'Site Settings', icon: Sliders },
  ];

  return (
    <>
      <Navigation />
      <SidebarProvider>
        <div className="flex min-h-screen w-full pt-16">
          <Sidebar className="border-r border-white/20 bg-black/40">
            <SidebarContent className="pt-8">
              <SidebarGroup>
                <SidebarGroupLabel className="text-white/70 px-4">
                  Admin Tools
                </SidebarGroupLabel>
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
                        >
                          <tab.icon className="h-4 w-4 mr-2" />
                          <span>{tab.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 container mx-auto pt-8 pb-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-6 w-6 text-fm-gold" />
                <h1 className="text-3xl font-canela font-bold">Admin Controls</h1>
              </div>
              <p className="text-muted-foreground mb-6">
                Manage users and application settings
              </p>

              <DecorativeDivider
                marginTop="mt-0"
                marginBottom="mb-8"
                lineWidth="w-32"
                opacity={0.5}
              />

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-canela font-semibold">User Management</h2>
                  <p className="text-muted-foreground">
                    User management tools coming soon...
                  </p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
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
