import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LucideIcon, X } from 'lucide-react';

import { cn } from '@/shared/utils/utils';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { Button } from '@/components/common/shadcn/button';

export interface FloatingToolbarTab {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
  title?: string;
  visible?: boolean;
  group?: string;
  groupOrder?: number;
  alignment?: 'top' | 'bottom';
  groupLabel?: string;
}

interface BaseFloatingToolbarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string | null;
  onTabChange: (tabId: string) => void;
  tabs: FloatingToolbarTab[];
  className?: string;
  anchorOffset?: number;
}

export const BaseFloatingToolbar = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  tabs,
  className,
  anchorOffset = 96,
}: BaseFloatingToolbarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTabHovered, setIsTabHovered] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const startYRef = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const dragStartTimeRef = useRef<number>(0);

  const visibleTabs = useMemo(
    () => {
      const filtered = tabs.filter(tab => tab.visible !== false);
      // Sort by groupOrder first, then by order in array
      return filtered.sort((a, b) => {
        const orderA = a.groupOrder ?? 999;
        const orderB = b.groupOrder ?? 999;
        return orderA - orderB;
      });
    },
    [tabs]
  );

  // Group tabs by their alignment and group property for rendering
  const { topGroups, bottomGroups } = useMemo(() => {
    const topTabs = visibleTabs.filter(tab => tab.alignment === 'top');
    const bottomTabs = visibleTabs.filter(tab => tab.alignment !== 'top');

    const createGroups = (tabs: FloatingToolbarTab[]) => {
      const groups: { group: string; tabs: FloatingToolbarTab[] }[] = [];
      let currentGroup: string | undefined;
      let currentTabs: FloatingToolbarTab[] = [];

      tabs.forEach((tab, index) => {
        if (tab.group !== currentGroup && currentTabs.length > 0) {
          groups.push({ group: currentGroup || 'default', tabs: currentTabs });
          currentTabs = [];
        }
        currentGroup = tab.group;
        currentTabs.push(tab);

        // Push the last group
        if (index === tabs.length - 1) {
          groups.push({ group: currentGroup || 'default', tabs: currentTabs });
        }
      });

      return groups;
    };

    return {
      topGroups: createGroups(topTabs),
      bottomGroups: createGroups(bottomTabs),
    };
  }, [visibleTabs]);

  const activeTabData = useMemo(
    () => visibleTabs.find(tab => tab.id === activeTab),
    [visibleTabs, activeTab]
  );

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId && isOpen) {
      onToggle();
      return;
    }

    onTabChange(tabId);
    if (!isOpen) {
      onToggle();
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    dragStartTimeRef.current = Date.now();
    startYRef.current = event.clientY;
    initialOffsetRef.current = dragOffset;
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!tabsContainerRef.current) return;

    const deltaY = event.clientY - startYRef.current;
    const containerHeight = tabsContainerRef.current.offsetHeight;
    const viewportHeight = window.innerHeight - anchorOffset;

    const maxOffset = 0;
    const minOffset = Math.min(0, -(containerHeight - viewportHeight));

    const nextOffset = Math.max(
      minOffset,
      Math.min(maxOffset, initialOffsetRef.current + deltaY)
    );
    setDragOffset(nextOffset);
  }, [anchorOffset]);

  const handleMouseUp = useCallback(() => {
    const dragDuration = Date.now() - dragStartTimeRef.current;
    const dragDistance = Math.abs(dragOffset - initialOffsetRef.current);

    if (dragDuration < 200 && dragDistance < 5) {
      setDragOffset(initialOffsetRef.current);
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

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-[100] transition-all duration-300 ease-in-out',
        className
      )}
      style={{
        width: isOpen ? '320px' : '0px',
      }}
    >
      {/* Developer Toolbar Indicator */}
      <div 
        className='absolute bottom-0 right-full h-full bg-black/80 backdrop-blur-md border-l border-white/20 transition-all duration-300'
        style={{
          width: isTabHovered ? (isOpen ? '0px' : '6px') : '2px',
        }}
      />

      {/* Top-aligned tabs */}
      {topGroups.length > 0 && (
        <div
          className='absolute top-0 right-full flex flex-col pl-1 transition-all duration-300'
          style={{
            transform: `translateX(${isTabHovered ? (isOpen ? '2px' : '-4px') : '0px'})`,
            marginRight: '2px',
            marginTop: '80px',
          }}
          onMouseEnter={() => setIsTabHovered(true)}
          onMouseLeave={() => setIsTabHovered(false)}
        >
          {topGroups.map((group, groupIndex) => {
            const shouldShowLabel = topGroups.length >= 2 && group.tabs.length > 1;
            const groupLabel = group.tabs[0]?.groupLabel;

            return (
              <div
                key={group.group}
                className={cn(
                  'relative flex flex-col gap-2',
                  groupIndex > 0 && 'mt-6'
                )}
                onMouseEnter={() => setHoveredGroup(group.group)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                {/* Group label with brace effect */}
                {shouldShowLabel && groupLabel && (
                  <div
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 flex items-center transition-opacity duration-200',
                      hoveredGroup === group.group ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    {/* Brace effect */}
                    <div className="flex flex-col items-center h-full justify-center mr-1">
                      <div className="w-2 h-2 border-l border-t border-white/30 rounded-tl" />
                      <div className="w-0.5 flex-1 bg-white/30" />
                      <div className="w-2 h-2 border-l border-b border-white/30 rounded-bl" />
                    </div>
                    {/* Label */}
                    <span
                      className="text-[10px] text-white/60 whitespace-nowrap"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      {groupLabel}
                    </span>
                  </div>
                )}
                
                {group.tabs.map(tab => (
                  <FmCommonTab
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    isActive={activeTab === tab.id}
                    onClick={() => {
                      if (!isDragging) {
                        handleTabClick(tab.id);
                      }
                    }}
                    variant='vertical'
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom-aligned tabs */}
      {bottomGroups.length > 0 && (
        <div
          ref={tabsContainerRef}
          className='absolute bottom-0 right-full flex flex-col pl-1 transition-all duration-300'
          style={{
            transform: `translateY(${dragOffset}px) translateX(${isTabHovered ? (isOpen ? '2px' : '-4px') : '0px'})`,
            cursor: isDragging ? 'grabbing' : 'grab',
            marginRight: '2px',
            marginBottom: `${anchorOffset}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsTabHovered(true)}
          onMouseLeave={() => setIsTabHovered(false)}
        >
          {bottomGroups.map((group, groupIndex) => {
            const shouldShowLabel = bottomGroups.length >= 2 && group.tabs.length > 1;
            const groupLabel = group.tabs[0]?.groupLabel;

            return (
              <div
                key={group.group}
                className={cn(
                  'relative flex flex-col gap-2',
                  groupIndex > 0 && 'mt-6'
                )}
                onMouseEnter={() => setHoveredGroup(group.group)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                {/* Group label with brace effect */}
                {shouldShowLabel && groupLabel && (
                  <div
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 flex items-center transition-opacity duration-200',
                      hoveredGroup === group.group ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    {/* Brace effect */}
                    <div className="flex flex-col items-center h-full justify-center mr-1">
                      <div className="w-2 h-2 border-l border-t border-white/30 rounded-tl" />
                      <div className="w-0.5 flex-1 bg-white/30" />
                      <div className="w-2 h-2 border-l border-b border-white/30 rounded-bl" />
                    </div>
                    {/* Label */}
                    <span
                      className="text-[10px] text-white/60 whitespace-nowrap"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      {groupLabel}
                    </span>
                  </div>
                )}
                
                {group.tabs.map(tab => (
                  <FmCommonTab
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    isActive={activeTab === tab.id}
                    onClick={() => {
                      if (!isDragging) {
                        handleTabClick(tab.id);
                      }
                    }}
                    variant='vertical'
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          'h-screen bg-black/90 backdrop-blur-md border-l border-white/20 overflow-y-auto transition-all duration-300 ease-in-out pointer-events-auto',
          isOpen ? 'w-80' : 'w-0'
        )}
      >
        {isOpen && (
          <div className='pt-8 px-6 pointer-events-auto h-full'>
            <Button
              variant='ghost'
              size='icon'
              onClick={onToggle}
              className='absolute top-4 right-4 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10'
            >
              <X className='h-4 w-4' />
            </Button>

            {activeTabData && (
              <>
                <h2 className='font-canela text-2xl text-white mb-6'>
                  {activeTabData.title || activeTabData.label}
                </h2>
                <div className='space-y-6'>{activeTabData.content}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

