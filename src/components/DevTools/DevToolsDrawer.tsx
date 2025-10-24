import { Hammer, ToggleLeft, Ticket, PlusCircle, Navigation as NavIcon, X } from 'lucide-react';
import { useState } from 'react';
import { FmCommonTab } from '@/components/ui/FmCommonTab';
import { RoleSelectSection } from './RoleSelectSection';
import { FeatureToggleSection } from './FeatureToggleSection';
import { CreationToolsSection } from './CreationToolsSection';
import { TicketingSection } from './TicketingSection';
import { DevNavigationSection } from './DevNavigationSection';
import { cn } from '@/shared/utils/utils';
import { isDevelopment } from '@/shared/utils/environment';
import { useDevTools } from '@/contexts/DevToolsContext';
import type { DevRole } from '@/contexts/DevToolsContext';
import { Button } from '@/components/ui/button';

type TabId = 'navigation' | 'creation' | 'tools' | 'ticketing' | 'features';

export const DevToolsDrawer = () => {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const { devRole, setDevRole, isDrawerOpen, toggleDrawer } = useDevTools();
  const isOpen = isDrawerOpen;

  // Only render in development
  if (!isDevelopment()) {
    return null;
  }

  const handleTabClick = (tabId: TabId) => {
    if (activeTab === tabId && isOpen) {
      // Clicking active tab closes the drawer
      toggleDrawer();
      setActiveTab(null);
    } else {
      // Open drawer and switch to this tab
      if (!isOpen) {
        toggleDrawer();
      }
      setActiveTab(tabId);
    }
  };

  const handleRoleChange = (role: DevRole) => {
    setDevRole(role);
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] transition-all duration-300 ease-in-out"
      style={{ width: isOpen ? '320px' : '0px', marginBottom: '96px' }}
    >
      {/* Label strip */}
      <div className="absolute bottom-0 right-full w-4 h-[calc(100vh-96px)] bg-black/95 border-l border-white/10 flex items-start justify-center pt-8">
        <span className="text-white/40 text-[10px] font-medium tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          DEVELOPER TOOLS
        </span>
      </div>

      {/* Tabs - positioned absolutely at the left edge */}
      <div className="absolute bottom-0 right-full flex flex-col gap-2 pr-4">
        <FmCommonTab
          icon={NavIcon}
          label="Dev Navigation"
          isActive={activeTab === 'navigation'}
          onClick={() => handleTabClick('navigation')}
          variant="vertical"
        />
        <FmCommonTab
          icon={PlusCircle}
          label="Creation Tools"
          isActive={activeTab === 'creation'}
          onClick={() => handleTabClick('creation')}
          variant="vertical"
        />
        <FmCommonTab
          icon={Hammer}
          label="Developer Tools"
          isActive={activeTab === 'tools'}
          onClick={() => handleTabClick('tools')}
          variant="vertical"
        />
        <FmCommonTab
          icon={Ticket}
          label="Ticketing"
          isActive={activeTab === 'ticketing'}
          onClick={() => handleTabClick('ticketing')}
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
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDrawer}
              className="absolute top-4 right-4 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>

            <h2 className="font-canela text-2xl text-white mb-6">
              {activeTab === 'navigation'
                ? 'Dev Navigation'
                : activeTab === 'creation'
                ? 'Creation Tools'
                : activeTab === 'tools' 
                ? 'Developer Tools' 
                : activeTab === 'ticketing'
                ? 'Ticketing'
                : 'Feature Toggles'}
            </h2>

            {activeTab === 'navigation' && (
              <div className="space-y-0">
                <DevNavigationSection />
              </div>
            )}

            {activeTab === 'creation' && (
              <div className="space-y-0">
                <CreationToolsSection />
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-0">
                <RoleSelectSection currentRole={devRole} onRoleChange={handleRoleChange} />
              </div>
            )}

            {activeTab === 'ticketing' && (
              <div className="space-y-0">
                <TicketingSection />
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
