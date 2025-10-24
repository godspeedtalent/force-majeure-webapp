import { Hammer, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { FmCommonTab } from '@/components/ui/FmCommonTab';
import { RoleSelectSection } from './RoleSelectSection';
import { FeatureToggleSection } from './FeatureToggleSection';
import { cn } from '@/shared/utils/utils';
import { isDevelopment } from '@/shared/utils/environment';
import { useDevTools } from '@/contexts/DevToolsContext';
import type { DevRole } from '@/contexts/DevToolsContext';

type TabId = 'tools' | 'features';

export const DevToolsDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const { devRole, setDevRole } = useDevTools();

  // Only render in development
  if (!isDevelopment()) {
    return null;
  }

  const handleTabClick = (tabId: TabId) => {
    if (activeTab === tabId && isOpen) {
      // Clicking active tab closes the drawer
      setIsOpen(false);
      setActiveTab(null);
    } else {
      // Open drawer and switch to this tab
      setIsOpen(true);
      setActiveTab(tabId);
    }
  };

  const handleRoleChange = (role: DevRole) => {
    setDevRole(role);
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-[45] transition-all duration-300 ease-in-out"
      style={{ width: isOpen ? '320px' : '0px', marginBottom: '96px' }}
    >
      {/* Tabs - positioned absolutely at the left edge */}
      <div className="absolute bottom-0 right-full flex flex-col gap-2 pr-0">
        <FmCommonTab
          icon={Hammer}
          label="Developer Tools"
          isActive={activeTab === 'tools'}
          onClick={() => handleTabClick('tools')}
          variant="vertical"
        />
        <FmCommonTab
          icon={ToggleLeft}
          label="Feature Toggles"
          isActive={activeTab === 'features'}
          onClick={() => handleTabClick('features')}
          variant="vertical"
        />
      </div>

      {/* Drawer */}
      <div
        className={cn(
          'h-[calc(100vh-96px)] bg-black/90 backdrop-blur-md border-l border-white/20 overflow-y-auto transition-all duration-300 ease-in-out',
          isOpen ? 'w-80' : 'w-0'
        )}
      >
        {isOpen && (
          <div className="pt-8 px-6">
            <h2 className="font-canela text-2xl text-white mb-6">
              {activeTab === 'tools' ? 'Developer Tools' : 'Feature Toggles'}
            </h2>

            {activeTab === 'tools' && (
              <div className="space-y-0">
                <RoleSelectSection currentRole={devRole} onRoleChange={handleRoleChange} />
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-0">
                <FeatureToggleSection />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
