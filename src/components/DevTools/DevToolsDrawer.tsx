import { Hammer, Package } from 'lucide-react';
import { useState } from 'react';
import { FmCommonTab } from '@/components/ui/FmCommonTab';
import { RoleSelectSection, DevRole } from './RoleSelectSection';
import { cn } from '@/shared/utils/utils';
import { isDevelopment } from '@/shared/utils/environment';

type TabId = 'tools' | 'placeholder';

export const DevToolsDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [currentRole, setCurrentRole] = useState<DevRole>('fan');

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
    setCurrentRole(role);
    // TODO: Implement role mocking logic here
    console.log('Dev role changed to:', role);
  };

  return (
    <div
      className="fixed bottom-6 right-0 z-50 transition-all duration-300 ease-in-out"
      style={{ width: isOpen ? '320px' : '0px' }}
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
          icon={Package}
          label="Placeholder"
          isActive={activeTab === 'placeholder'}
          onClick={() => handleTabClick('placeholder')}
          variant="vertical"
        />
      </div>

      {/* Drawer */}
      <div
        className={cn(
          'h-[calc(100vh-3rem)] bg-fm-gold/20 backdrop-blur-md border-l border-fm-gold/30 overflow-y-auto transition-all duration-300 ease-in-out',
          isOpen ? 'w-80' : 'w-0'
        )}
      >
        {isOpen && (
          <div className="p-6">
            <h2 className="font-screamer text-2xl text-fm-gold mb-6">
              {activeTab === 'tools' ? 'Developer Tools' : 'Placeholder Tab'}
            </h2>

            {activeTab === 'tools' && (
              <div className="space-y-2">
                <RoleSelectSection currentRole={currentRole} onRoleChange={handleRoleChange} />
              </div>
            )}

            {activeTab === 'placeholder' && (
              <p className="text-sm text-muted-foreground">This is a placeholder tab.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
