import { Hammer, ToggleLeft, Ticket, PlusCircle, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FmCommonTab } from '@/components/ui/FmCommonTab';
import { RoleSelectSection } from './RoleSelectSection';
import { FeatureToggleSection } from './FeatureToggleSection';
import { CreationToolsSection } from './CreationToolsSection';
import { TicketingSection } from './TicketingSection';
import { cn } from '@/shared/utils/utils';
import { isDevelopment } from '@/shared/utils/environment';
import { useDevTools } from '@/contexts/DevToolsContext';
import type { DevRole } from '@/contexts/DevToolsContext';
import { Button } from '@/components/ui/button';

type TabId = 'creation' | 'tools' | 'ticketing' | 'features';

export const DevToolsDrawer = () => {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const { devRole, setDevRole, isDrawerOpen, toggleDrawer } = useDevTools();
  const isOpen = isDrawerOpen;
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const dragStartTimeRef = useRef<number>(0);

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

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartTimeRef.current = Date.now();
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!tabsContainerRef.current) return;

    const deltaY = e.clientY - startY;
    const containerHeight = tabsContainerRef.current.offsetHeight;
    const viewportHeight = window.innerHeight - 96; // Account for bottom margin
    
    // Calculate bounds
    const maxOffset = 0; // Top bound
    const minOffset = -(containerHeight - viewportHeight); // Bottom bound
    
    // Clamp the offset within bounds
    const newOffset = Math.max(minOffset, Math.min(maxOffset, deltaY));
    setDragOffset(newOffset);
  }, [startY]);

  const handleMouseUp = useCallback(() => {
    const dragDuration = Date.now() - dragStartTimeRef.current;
    
    // If drag was very short (less than 200ms), treat it as a click
    if (dragDuration < 200 && Math.abs(dragOffset) < 5) {
      setIsDragging(false);
      setDragOffset(0);
      setStartY(0);
      return;
    }
    
    setIsDragging(false);
    setStartY(0);
    // Keep the offset to maintain position
  }, [dragOffset]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
      <div 
        ref={tabsContainerRef}
        className="absolute bottom-0 right-full flex flex-col gap-2 pr-4 transition-transform"
        style={{ 
          transform: `translateY(${dragOffset}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <FmCommonTab
          icon={PlusCircle}
          label="Creation Tools"
          isActive={activeTab === 'creation'}
          onClick={() => !isDragging && handleTabClick('creation')}
          variant="vertical"
        />
        <FmCommonTab
          icon={Hammer}
          label="Developer Tools"
          isActive={activeTab === 'tools'}
          onClick={() => !isDragging && handleTabClick('tools')}
          variant="vertical"
        />
        <FmCommonTab
          icon={Ticket}
          label="Ticketing"
          isActive={activeTab === 'ticketing'}
          onClick={() => !isDragging && handleTabClick('ticketing')}
          variant="vertical"
        />
        <FmCommonTab
          icon={ToggleLeft}
          label="Feature Toggles"
          isActive={activeTab === 'features'}
          onClick={() => !isDragging && handleTabClick('features')}
          variant="vertical"
        />
      </div>

      {/* Drawer */}
      <div
        className={cn(
          'h-[calc(100vh-96px)] bg-black/90 backdrop-blur-md border-l border-white/20 overflow-y-auto transition-all duration-300 ease-in-out pointer-events-auto',
          isOpen ? 'w-80' : 'w-0'
        )}
      >
        {isOpen && (
          <div className="pt-8 px-6 pointer-events-auto">
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
              {activeTab === 'creation'
                ? 'Creation Tools'
                : activeTab === 'tools' 
                ? 'Developer Tools' 
                : activeTab === 'ticketing'
                ? 'Ticketing'
                : 'Feature Toggles'}
            </h2>

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
