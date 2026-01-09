import { useState, useCallback } from 'react';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import {
  Sliders,
  Code,
  Shield,
  DollarSign,
  Users,
  Database,
  Building2,
} from 'lucide-react';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminTicketingSection } from '@/components/admin/AdminTicketingSection';
import { UserManagement } from './UserManagement';
import { OrganizationsManagement } from './OrganizationsManagement';
import { formatHeader } from '@/shared';

type AdminTab = 'devtools' | 'ticketing' | 'settings' | 'users' | 'organizations';

export default function AdminControls() {
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');

  // Handle tab changes
  const handleTabChange = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
  }, []);

  // Navigation groups configuration - Alphabetically sorted
  const navigationGroups: FmCommonSideNavGroup<AdminTab>[] = [
    {
      label: 'Site Controls',
      icon: Shield,
      items: [
        {
          id: 'devtools',
          label: 'Developer Tools',
          icon: Code,
          description: 'Toggle dev environment features',
        },
        {
          id: 'ticketing',
          label: 'Ticketing',
          icon: DollarSign,
          description: 'Configure ticketing fees and checkout behavior',
        },
        {
          id: 'settings',
          label: 'Site Settings',
          icon: Sliders,
          description: 'Configure site settings',
        },
      ],
    },
    {
      label: 'Database',
      icon: Database,
      items: [
        {
          id: 'organizations',
          label: 'Organizations',
          icon: Building2,
          description: 'Manage organizations',
        },
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          description: 'Manage user accounts',
        },
      ],
    },
  ];

  // Mobile bottom tabs configuration
  const mobileTabs: MobileBottomTab[] = [
    { id: 'devtools', label: 'Dev Tools', icon: Code },
    { id: 'ticketing', label: 'Ticketing', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'organizations', label: 'Orgs', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const getTabTitle = () => {
    if (activeTab === 'settings') return 'Site Settings';
    if (activeTab === 'devtools') return 'Developer Tools';
    if (activeTab === 'ticketing') return 'Ticketing';
    if (activeTab === 'users') return 'Users';
    if (activeTab === 'organizations') return 'Organizations';
    return 'Admin Controls';
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
      mobileTabBar={
        <MobileBottomTabBar
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={tab => handleTabChange(tab as AdminTab)}
        />
      }
    >
      <div className='max-w-full'>
        <div className='mb-[20px]'>
          <div className='flex items-center gap-[10px] mb-[20px]'>
            <Sliders className='h-6 w-6 text-fm-gold' />
            <h1 className='text-3xl font-canela'>
              {formatHeader(getTabTitle())}
            </h1>
          </div>
        </div>

        <DecorativeDivider
          marginTop='mt-0'
          marginBottom='mb-6'
          lineWidth='w-32'
          opacity={0.5}
        />

        {activeTab === 'settings' && (
          <div className='space-y-8'>
            <div>
              <h3 className='text-lg font-canela font-semibold mb-2'>
                {formatHeader('Feature Flags')}
              </h3>
              <p className='text-muted-foreground text-sm mb-4'>
                Control feature availability across different environments
              </p>
              <FeatureToggleSection />
            </div>
          </div>
        )}

        {activeTab === 'ticketing' && (
          <div className='space-y-6'>
            <div>
              <p className='text-muted-foreground text-sm mb-4'>
                Configure checkout timer and fees applied to all ticket purchases
              </p>
              <AdminTicketingSection />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className='space-y-6'>
            <div>
              <p className='text-muted-foreground text-sm mb-4'>
                Manage user accounts, roles, and permissions
              </p>
              <UserManagement />
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <div className='space-y-6'>
            <div>
              <p className='text-muted-foreground text-sm mb-4'>
                Manage organizations and their settings
              </p>
              <OrganizationsManagement />
            </div>
          </div>
        )}


        {activeTab === 'devtools' && (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-canela font-semibold mb-2'>
                {formatHeader('Dev Toolbar Sections')}
              </h3>
              <p className='text-muted-foreground text-sm mb-4'>
                Control which sections appear in the developer toolbar for
                testing
              </p>
              <p className='text-muted-foreground italic'>
                Dev toolbar management coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </SideNavbarLayout>
  );
}
