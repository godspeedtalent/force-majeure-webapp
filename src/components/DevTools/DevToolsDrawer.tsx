import { useEffect, useMemo, useState } from 'react';
import { Database, Hammer, ShoppingCart, ToggleLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { CreationToolsSection } from './CreationToolsSection';
import { EventListSection } from './EventListSection';
import { FeatureToggleSection } from './FeatureToggleSection';
import { DevNotesSection } from './DevNotesSection';
import { BaseFloatingToolbar, type FloatingToolbarTab } from './BaseFloatingToolbar';

import { useDevTools } from '@/contexts/DevToolsContext';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';

type TabId = 'database' | 'tools' | 'features' | 'cart' | 'notes';

export const DevToolsDrawer = () => {
  const { isDrawerOpen, toggleDrawer } = useDevTools();
  const { user } = useAuth();
  const { hasAnyRole } = useUserPermissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId | null>(null);

  // Check if user has actual developer or admin role
  const isDeveloperOrAdmin = hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN);

  const tabs: FloatingToolbarTab[] = useMemo(
    () => [
      {
        id: 'cart',
        label: 'Shopping Cart',
        icon: ShoppingCart,
        content: (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">
              Why not{' '}
              <Link
                to="/merch"
                className="text-fm-gold hover:text-fm-gold/80 underline transition-colors"
              >
                check out our merch
              </Link>
              ?
            </p>
          </div>
        ),
        title: 'Shopping Cart',
        visible: Boolean(user),
        group: 'user',
        groupOrder: 1,
        alignment: 'top',
      },
      {
        id: 'tools',
        label: 'Developer Tools',
        icon: Hammer,
        content: (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Navigation</h4>
              <div className="grid grid-cols-2 gap-2">
                <FmCommonButton
                  variant="default"
                  size="sm"
                  className="h-auto py-2 px-3 justify-between text-left whitespace-normal"
                  onClick={() => navigate('/developer')}
                >
                  <span>Developer Home</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </FmCommonButton>
                <FmCommonButton
                  variant="default"
                  size="sm"
                  className="h-auto py-2 px-3 justify-between text-left whitespace-normal"
                  onClick={() => navigate('/developer/components')}
                >
                  <span>Component Catalog</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </FmCommonButton>
                <FmCommonButton
                  variant="default"
                  size="sm"
                  className="h-auto py-2 px-3 justify-between text-left whitespace-normal"
                  onClick={() => navigate('/admin/controls')}
                >
                  <span>Admin Controls</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </FmCommonButton>
                <FmCommonButton
                  variant="default"
                  size="sm"
                  className="h-auto py-2 px-3 justify-start text-left whitespace-normal"
                  onClick={() => {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    if (supabaseUrl) {
                      const projectId = new URL(supabaseUrl).hostname.split('.')[0];
                      window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank');
                    }
                  }}
                >
                  Supabase Dashboard
                </FmCommonButton>
              </div>
            </div>
          </div>
        ),
        title: 'Developer Tools',
        visible: isDeveloperOrAdmin,
        group: 'developer',
        groupOrder: 2,
        alignment: 'bottom',
        groupLabel: 'Developer Tools',
      },
      {
        id: 'database',
        label: 'Database',
        icon: Database,
        content: (
          <div className='space-y-8'>
            <CreationToolsSection />
            <EventListSection />
          </div>
        ),
        title: 'Database Manager',
        visible: isDeveloperOrAdmin,
        group: 'developer',
        groupOrder: 2,
        alignment: 'bottom',
        groupLabel: 'Developer Tools',
      },
      {
        id: 'features',
        label: 'Feature Toggles',
        icon: ToggleLeft,
        content: <FeatureToggleSection />,
        title: 'Feature Toggles',
        visible: isDeveloperOrAdmin,
        group: 'developer',
        groupOrder: 2,
        alignment: 'bottom',
        groupLabel: 'Developer Tools',
      },
      {
        id: 'notes',
        label: 'TODO Notes',
        icon: ClipboardList,
        content: <DevNotesSection />,
        title: 'Developer TODO Notes',
        visible: isDeveloperOrAdmin,
        group: 'developer',
        groupOrder: 2,
        alignment: 'bottom',
        groupLabel: 'Developer Tools',
      },
    ],
    [isDeveloperOrAdmin, user, navigate]
  );

  const visibleTabs = useMemo(
    () => tabs.filter(tab => tab.visible !== false),
    [tabs]
  );

  useEffect(() => {
    if (visibleTabs.length === 0) {
      setActiveTab(null);
      return;
    }

    // Only auto-select first tab if drawer is open and no valid tab is selected
    if (isDrawerOpen && (!activeTab || !visibleTabs.some(tab => tab.id === activeTab))) {
      setActiveTab(visibleTabs[0].id as TabId);
    }
    
    // Clear active tab when drawer closes
    if (!isDrawerOpen && activeTab) {
      setActiveTab(null);
    }
  }, [visibleTabs, activeTab, isDrawerOpen]);

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <BaseFloatingToolbar
      isOpen={isDrawerOpen}
      onToggle={toggleDrawer}
      activeTab={activeTab}
      onTabChange={tabId => setActiveTab(tabId as TabId)}
      tabs={tabs}
    />
  );
};
