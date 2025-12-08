import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import {
  Sliders,
  Settings,
  Code,
  Shield,
  DollarSign,
  Users,
  Database,
  Building2,
  Activity,
  ClipboardList,
} from 'lucide-react';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminFeesSection } from '@/components/admin/AdminFeesSection';
import { DevToolsManagement } from '@/components/admin/DevToolsManagement';
import { UserManagement } from './UserManagement';
import { OrganizationsManagement } from './OrganizationsManagement';
import { UserRequestsAdmin } from '@/components/admin/UserRequestsAdmin';
import { formatHeader } from '@force-majeure/shared/utils/styleUtils';

type AdminTab = 'devtools' | 'fees' | 'settings' | 'users' | 'organizations' | 'requests' | 'logs';

export default function AdminControls() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');

  // Handle tab changes - some tabs navigate to external pages
  const handleTabChange = useCallback((tab: AdminTab) => {
    if (tab === 'logs') {
      navigate('/admin/logs');
    } else {
      setActiveTab(tab);
    }
  }, [navigate]);

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
          id: 'fees',
          label: 'Ticketing Fees',
          icon: DollarSign,
          description: 'Configure ticketing fees',
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
          id: 'requests',
          label: 'User Requests',
          icon: ClipboardList,
          description: 'Review user requests',
        },
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          description: 'Manage user accounts',
        },
      ],
    },
    {
      label: 'Monitoring',
      icon: Activity,
      items: [
        {
          id: 'logs',
          label: 'Activity Logs',
          icon: Activity,
          description: 'View system activity logs',
          isExternal: true,
        },
      ],
    },
  ];

  // Mobile bottom tabs configuration
  const mobileTabs: MobileBottomTab[] = [
    { id: 'devtools', label: 'Dev Tools', icon: Code },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'organizations', label: 'Orgs', icon: Building2 },
    { id: 'requests', label: 'Requests', icon: ClipboardList },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const getTabTitle = () => {
    if (activeTab === 'settings') return 'Site Settings';
    if (activeTab === 'devtools') return 'Developer Tools';
    if (activeTab === 'fees') return 'Ticketing Fees';
    if (activeTab === 'users') return 'Users';
    if (activeTab === 'organizations') return 'Organizations';
    if (activeTab === 'requests') return 'User Requests';
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
            <Settings className='h-6 w-6 text-fm-gold' />
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

        {activeTab === 'fees' && (
          <div className='space-y-6'>
            <div>
              <p className='text-muted-foreground text-sm mb-4'>
                Configure site-wide fees and taxes applied to all ticket
                purchases
              </p>
              <AdminFeesSection />
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

        {activeTab === 'requests' && (
          <div className='space-y-6'>
            <div>
              <p className='text-muted-foreground text-sm mb-4'>
                Review and manage user requests for artist linking, data deletion, and more.
              </p>
              <UserRequestsAdmin />
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
              <DevToolsManagement />
            </div>
          </div>
        )}
      </div>
    </SideNavbarLayout>
  );
}
