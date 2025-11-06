import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Database, Compass, ShoppingCart, ToggleLeft, ClipboardList, LucideIcon, X, Home, Shield, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { cn } from '@/shared/utils/utils';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Separator } from '@/components/common/shadcn/separator';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';

// Lazy load sections  
import { CreationToolsSection } from '@/components/devtools/CreationToolsSection';
import { EventListSection } from '@/components/devtools/EventListSection';
import { FeatureToggleSection } from '@/components/devtools/FeatureToggleSection';
import { DevNotesSection } from '@/components/devtools/DevNotesSection';

export interface ToolbarTab {
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

interface FmToolbarProps {
  className?: string;
  anchorOffset?: number;
}

export const FmToolbar = ({
  className,
  anchorOffset = 96,
}: FmToolbarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTabHovered, setIsTabHovered] = useState(false);
  const [showGroupLabel, setShowGroupLabel] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { hasAnyRole } = useUserPermissions();
  const navigate = useNavigate();
  
  const startYRef = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const dragStartTimeRef = useRef<number>(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has actual developer or admin role
  const isDeveloperOrAdmin = hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN);

  // Define all tabs based on user roles/permissions
  const tabs: ToolbarTab[] = useMemo(
    () => [
      {
        id: 'cart',
        label: 'Shopping Cart',
        icon: ShoppingCart,
        content: (
          <div className="space-y-4">
            <Separator className="bg-white/10" />
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
        label: 'Dev Navigation',
        icon: Compass,
        content: (
          <div className="space-y-4">
            <Separator className="bg-white/10" />
            <div className="flex flex-col gap-2">
              <FmCommonButton
                variant="default"
                icon={Home}
                iconPosition="left"
                onClick={() => navigate('/developer')}
                className="w-full justify-start"
              >
                Developer Home
              </FmCommonButton>
              <FmCommonButton
                variant="default"
                icon={Shield}
                iconPosition="left"
                onClick={() => navigate('/admin/controls')}
                className="w-full justify-start"
              >
                Admin Controls
              </FmCommonButton>
              <FmCommonButton
                variant="default"
                icon={ExternalLink}
                iconPosition="left"
                onClick={() => {
                  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                  if (supabaseUrl) {
                    const projectId = new URL(supabaseUrl).hostname.split('.')[0];
                    window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank');
                  }
                }}
                className="w-full justify-start"
              >
                Supabase Dashboard
              </FmCommonButton>
            </div>
          </div>
        ),
        title: 'Dev Navigation',
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
          <div className='space-y-4'>
            <Separator className="bg-white/10" />
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
        content: (
          <div className='space-y-4'>
            <Separator className="bg-white/10" />
            <FeatureToggleSection />
          </div>
        ),
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
        content: (
          <div className='space-y-4'>
            <Separator className="bg-white/10" />
            <DevNotesSection />
          </div>
        ),
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

    const createGroups = (tabs: ToolbarTab[]) => {
      const groups: { group: string; tabs: ToolbarTab[] }[] = [];
      let currentGroup: string | undefined;
      let currentTabs: ToolbarTab[] = [];

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
      setIsOpen(false);
      return;
    }

    setActiveTab(tabId);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleGroupMouseEnter = (groupName: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Set timeout to show label after 1 second
    hoverTimeoutRef.current = setTimeout(() => {
      setShowGroupLabel(groupName);
    }, 1000);
  };

  const handleGroupMouseLeave = () => {
    // Clear timeout if user leaves before 1 second
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Fade out immediately
    setShowGroupLabel(null);
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

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Auto-select first tab when drawer opens
  useEffect(() => {
    if (visibleTabs.length === 0) {
      setActiveTab(null);
      return;
    }

    // Only auto-select first tab if drawer is open and no valid tab is selected
    if (isOpen && (!activeTab || !visibleTabs.some(tab => tab.id === activeTab))) {
      setActiveTab(visibleTabs[0].id);
    }
    
    // Clear active tab when drawer closes
    if (!isOpen && activeTab) {
      setActiveTab(null);
    }
  }, [visibleTabs, activeTab, isOpen]);

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
                onMouseEnter={() => handleGroupMouseEnter(group.group)}
                onMouseLeave={handleGroupMouseLeave}
              >
                {/* Group label with brace effect */}
                {shouldShowLabel && groupLabel && (
                  <div
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[52px] flex items-center transition-opacity duration-300',
                      showGroupLabel === group.group ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                  >
                    {/* Brace effect - much thinner */}
                    <div className="flex flex-col items-center justify-center mr-1.5" style={{ height: '100%' }}>
                      <div className="w-1.5 h-1.5 border-l border-t border-white/20 rounded-tl-sm" style={{ borderWidth: '0.5px' }} />
                      <div className="flex-1 bg-white/20" style={{ width: '0.5px', minHeight: '20px' }} />
                      <div className="w-1.5 h-1.5 border-l border-b border-white/20 rounded-bl-sm" style={{ borderWidth: '0.5px' }} />
                    </div>
                    {/* Label */}
                    <span
                      className="text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide"
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
                onMouseEnter={() => handleGroupMouseEnter(group.group)}
                onMouseLeave={handleGroupMouseLeave}
              >
                {/* Group label with brace effect */}
                {shouldShowLabel && groupLabel && (
                  <div
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[52px] flex items-center transition-opacity duration-300',
                      showGroupLabel === group.group ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                  >
                    {/* Brace effect - much thinner */}
                    <div className="flex flex-col items-center justify-center mr-1.5" style={{ height: '100%' }}>
                      <div className="w-1.5 h-1.5 border-l border-t border-white/20 rounded-tl-sm" style={{ borderWidth: '0.5px' }} />
                      <div className="flex-1 bg-white/20" style={{ width: '0.5px', minHeight: '20px' }} />
                      <div className="w-1.5 h-1.5 border-l border-b border-white/20 rounded-bl-sm" style={{ borderWidth: '0.5px' }} />
                    </div>
                    {/* Label */}
                    <span
                      className="text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide"
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
              onClick={() => setIsOpen(false)}
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

