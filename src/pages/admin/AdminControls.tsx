import { useState } from 'react';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { Sliders, Settings, Code, Shield, DollarSign, Users } from 'lucide-react';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminFeesSection } from '@/components/admin/AdminFeesSection';
import { DevToolsManagement } from '@/components/admin/DevToolsManagement';
import { UserManagement } from './UserManagement';
import { formatHeader } from '@/shared/utils/styleUtils';

type AdminTab = 'devtools' | 'fees' | 'settings' | 'users';

export default function AdminControls() {
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');

  // Navigation groups configuration - Alphabetically sorted
  const navigationGroups: FmCommonSideNavGroup<AdminTab>[] = [
    {
      label: 'Site Controls',
      icon: Shield,
      items: [
        { id: 'devtools', label: 'Developer Tools', icon: Code, description: 'Toggle dev environment features' },
        { id: 'fees', label: 'Ticketing Fees', icon: DollarSign, description: 'Configure ticketing fees' },
        { id: 'settings', label: 'Site Settings', icon: Sliders, description: 'Configure site settings' },
        { id: 'users', label: 'User Management', icon: Users, description: 'Manage user accounts' },
      ],
    },
  ];

  const getTabTitle = () => {
    if (activeTab === 'settings') return 'Site Settings';
    if (activeTab === 'devtools') return 'Developer Tools';
    if (activeTab === 'fees') return 'Ticketing Fees';
    if (activeTab === 'users') return 'User Management';
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
        </div>

        <DecorativeDivider
          marginTop="mt-0"
          marginBottom="mb-6"
          lineWidth="w-32"
          opacity={0.5}
        />

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-canela font-semibold mb-2">{formatHeader('Feature Flags')}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Control feature availability across different environments
              </p>
              <FeatureToggleSection />
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground text-sm mb-4">
                Configure site-wide fees and taxes applied to all ticket purchases
              </p>
              <AdminFeesSection />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground text-sm mb-4">
                Manage user accounts and profiles
              </p>
              <UserManagement />
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
