import { useEffect, useMemo, useState } from 'react';
import { Database, ExternalLink, Hammer, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CreationToolsSection } from './CreationToolsSection';
import { EventListSection } from './EventListSection';
import { RoleSelectSection } from './RoleSelectSection';
import { BaseFloatingToolbar, type FloatingToolbarTab } from './BaseFloatingToolbar';

import { useDevTools } from '@/contexts/DevToolsContext';
import type { DevRole } from '@/contexts/DevToolsContext';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

type TabId = 'database' | 'tools' | 'cart';

export const DevToolsDrawer = () => {
  const { devRole, setDevRole, isDrawerOpen, toggleDrawer } = useDevTools();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId | null>(null);

  const handleRoleChange = (role: DevRole) => {
    setDevRole(role);
  };

  const isDeveloper = useMemo(
    () => devRole === 'developer' || devRole === 'admin',
    [devRole]
  );

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
            <RoleSelectSection currentRole={devRole} onRoleChange={handleRoleChange} />
            <div className="border-t border-border/50 pt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Quick Links</h4>
              <FmCommonButton
                variant="secondary"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                  if (supabaseUrl) {
                    const projectId = new URL(supabaseUrl).hostname.split('.')[0];
                    window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Open Supabase Project
              </FmCommonButton>
            </div>
          </div>
        ),
        title: 'Developer Tools',
        visible: isDeveloper,
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
        visible: isDeveloper,
        group: 'developer',
        groupOrder: 2,
        alignment: 'bottom',
        groupLabel: 'Developer Tools',
      },
    ],
    [devRole, handleRoleChange, isDeveloper, user]
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
