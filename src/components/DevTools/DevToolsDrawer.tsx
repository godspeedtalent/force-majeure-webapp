import { Hammer, ToggleLeft, Ticket, PlusCircle, X, Calendar } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FmCommonTab } from '@/components/ui/data/FmCommonTab';
import { RoleSelectSection } from './RoleSelectSection';
import { FeatureToggleSection } from './FeatureToggleSection';
import { CreationToolsSection } from './CreationToolsSection';
import { TicketingSection } from './TicketingSection';
import { EventListSection } from './EventListSection';
import { cn } from '@/shared/utils/utils';
import { isDevelopment } from '@/shared/utils/environment';
import { useDevTools } from '@/contexts/DevToolsContext';
import type { DevRole } from '@/contexts/DevToolsContext';
import { Button } from '@/components/ui/shadcn/button';

type TabId = 'creation' | 'tools' | 'ticketing' | 'features' | 'events';

const STORAGE_KEY = 'dev_tools_visibility';

export const DevToolsDrawer = () => {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const { devRole, setDevRole, isDrawerOpen, toggleDrawer } = useDevTools();
  const isOpen = isDrawerOpen;

  // Get visibility settings from localStorage
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    // Default: all enabled
    return { creation: true, tools: true, ticketing: true, features: true, events: true };
  });
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number>(0);
  const initialDragOffsetRef = useRef<number>(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const dragStartTimeRef = useRef<number>(0);

  // Only render in development
  if (!isDevelopment()) {
    return null;
  }

  const isSectionVisible = (sectionId: string) => {
    return visibleSections[sectionId] ?? true;
  };

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
    e.preventDefault(); // Prevent text selection
    dragStartTimeRef.current = Date.now();
    startYRef.current = e.clientY;
    initialDragOffsetRef.current = dragOffset;
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!tabsContainerRef.current) return;

    const deltaY = e.clientY - startYRef.current;
    const containerHeight = tabsContainerRef.current.offsetHeight;
    const viewportHeight = window.innerHeight - 96; // Account for bottom margin
    
    // Calculate bounds
    const maxOffset = 0; // Top bound (tabs can't go above their starting position)
    const minOffset = Math.min(0, -(containerHeight - viewportHeight)); // Bottom bound
    
    // Add delta to initial offset instead of using delta directly
    const newOffset = Math.max(minOffset, Math.min(maxOffset, initialDragOffsetRef.current + deltaY));
    setDragOffset(newOffset);
  }, []);

  const handleMouseUp = useCallback(() => {
    const dragDuration = Date.now() - dragStartTimeRef.current;
    const dragDistance = Math.abs(dragOffset - initialDragOffsetRef.current);
    
    // If drag was very short (less than 200ms) and small movement, treat it as a click
    if (dragDuration < 200 && dragDistance < 5) {
      setDragOffset(initialDragOffsetRef.current); // Reset to initial position
    }
    
    setIsDragging(false);
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
        {isSectionVisible('creation') && (
          <FmCommonTab
            icon={PlusCircle}
            label="Creation Tools"
            isActive={activeTab === 'creation'}
            onClick={() => !isDragging && handleTabClick('creation')}
            variant="vertical"
          />
        )}
        {isSectionVisible('tools') && (
          <FmCommonTab
            icon={Hammer}
            label="Developer Tools"
            isActive={activeTab === 'tools'}
            onClick={() => !isDragging && handleTabClick('tools')}
            variant="vertical"
          />
        )}
        {isSectionVisible('ticketing') && (
          <FmCommonTab
            icon={Ticket}
            label="Ticketing"
            isActive={activeTab === 'ticketing'}
            onClick={() => !isDragging && handleTabClick('ticketing')}
            variant="vertical"
          />
        )}
        {isSectionVisible('features') && (
          <FmCommonTab
            icon={ToggleLeft}
            label="Feature Toggles"
            isActive={activeTab === 'features'}
            onClick={() => !isDragging && handleTabClick('features')}
            variant="vertical"
          />
        )}
        {isSectionVisible('events') && (
          <FmCommonTab
            icon={Calendar}
            label="Event List"
            isActive={activeTab === 'events'}
            onClick={() => !isDragging && handleTabClick('events')}
            variant="vertical"
          />
        )}
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
                : activeTab === 'events'
                ? 'Event List'
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

            {activeTab === 'events' && (
              <div className="space-y-0">
                <EventListSection />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
