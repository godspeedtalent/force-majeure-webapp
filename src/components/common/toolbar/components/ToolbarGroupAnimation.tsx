import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, EyeOff } from 'lucide-react';

import { cn } from '@/shared';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { ToolbarTab } from '../FmToolbar';

/** Context menu for tab actions (hide) */
interface TabContextMenuProps {
  x: number;
  y: number;
  tabId: string;
  tabLabel: string;
  onHide: () => void;
  onClose: () => void;
  hideTabText: string;
}

const TabContextMenu = ({ x, y, tabLabel: _tabLabel, onHide, onClose, hideTabText }: TabContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    // Skip the first render to prevent immediate close from the same right-click event
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close on the initial mouseup from the right-click that opened the menu
      if (isInitialRender.current) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Use a small delay to prevent the initial right-click from closing the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    document.addEventListener('keydown', handleEscape);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position menu to the left of the cursor so it doesn't hang off screen
  const menuWidth = 140; // min-w-[140px]
  const adjustedX = x - menuWidth - 8; // 8px gap from cursor

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[9999] min-w-[140px] py-1',
        'bg-black/90 backdrop-blur-xl border border-white/20',
        'shadow-lg shadow-black/50',
        'animate-in fade-in zoom-in-95 duration-150'
      )}
      style={{ left: adjustedX, top: y }}
    >
      <button
        className={cn(
          'w-full px-3 py-1.5 text-left text-xs',
          'flex items-center gap-2',
          'hover:bg-fm-gold/10 hover:text-fm-gold',
          'transition-colors duration-200'
        )}
        onClick={() => {
          onHide();
          onClose();
        }}
      >
        <EyeOff className='h-3 w-3' />
        <span>{hideTabText}</span>
      </button>
    </div>,
    document.body
  );
};

// Animation states for group collapse/expand
type AnimationState = 'idle' | 'collapsing' | 'expanding';

// Group icons mapping - distinct icons for each group
import { Building2, Wrench, Settings2, Key, LucideIcon } from 'lucide-react';

export const GROUP_ICONS: Record<string, LucideIcon> = {
  organization: Building2,
  devTools: Wrench,
  dataConfig: Settings2,
  admin: Key,
};

// Collapsed group tab component - shows stacked tabs appearance
interface CollapsedGroupTabProps {
  groupName: string;
  tabs: ToolbarTab[];
  groupLabel?: string;
  activeTab: string | null;
  isDragging: boolean;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
}

export const CollapsedGroupTab = ({
  groupName,
  tabs,
  groupLabel,
  activeTab,
  isDragging,
  toggleGroupCollapsed,
  clickToExpandText,
}: CollapsedGroupTabProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const GroupIcon = GROUP_ICONS[groupName] || tabs[0]?.icon;
  const hasActiveTab = tabs.some(tab => activeTab === tab.id);

  // Number of "stacked" layers to show (max 2 for visual clarity)
  const stackLayers = Math.min(tabs.length - 1, 2);

  return (
    <div
      className='relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stacked tab layers behind the main tab */}
      {Array.from({ length: stackLayers }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute w-12 h-12',
            'bg-black/40 backdrop-blur-sm border border-white/10',
            'transition-all duration-200',
            hasActiveTab && 'border-fm-gold/20'
          )}
          style={{
            // Stack offset: each layer is offset down and right
            bottom: `-${(i + 1) * 3}px`,
            right: `-${(i + 1) * 3}px`,
            zIndex: -1 - i,
          }}
        />
      ))}

      {/* Main tab - same size as regular tabs */}
      <button
        className={cn(
          'relative flex items-center justify-center',
          'w-12 h-12 bg-black/70 backdrop-blur-md',
          'border border-white/20',
          'hover:border-fm-gold/50 hover:bg-black/80',
          'transition-all duration-300 cursor-pointer',
          hasActiveTab && 'border-fm-gold bg-fm-gold/10'
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            toggleGroupCollapsed(groupName);
          }
        }}
        title={`${groupLabel} (${tabs.length}) - ${clickToExpandText}`}
      >
        {/* Group icon */}
        {GroupIcon && (
          <GroupIcon
            className={cn(
              'h-5 w-5 transition-colors duration-200',
              hasActiveTab ? 'text-fm-gold' : 'text-white',
              isHovered && !hasActiveTab && 'text-white'
            )}
          />
        )}

        {/* Count badge - bottom left, square */}
        <div
          className={cn(
            'absolute -bottom-1 -left-1 flex items-center justify-center',
            'min-w-4 h-4 px-1 text-[9px] font-bold',
            'transition-colors duration-200',
            isHovered
              ? 'bg-black text-white ring-1 ring-white/60'
              : hasActiveTab
                ? 'bg-fm-gold text-black ring-1 ring-fm-gold/50'
                : 'bg-white text-black ring-1 ring-white/20'
          )}
        >
          {tabs.length}
        </div>
      </button>
    </div>
  );
};

// Expanded group with hover-to-show collapse button
interface ExpandedGroupWithCollapseButtonProps {
  group: { group: string; tabs: ToolbarTab[] };
  activeTab: string | null;
  isDragging: boolean;
  handleTabClick: (tabId: string) => void;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
  onHideTab?: (tabId: string) => void;
  hideTabText?: string;
}

export const ExpandedGroupWithCollapseButton = ({
  group,
  activeTab,
  isDragging,
  handleTabClick,
  toggleGroupCollapsed,
  clickToExpandText,
  onHideTab,
  hideTabText = 'Hide tab',
}: ExpandedGroupWithCollapseButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string; tabLabel: string } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, tab: ToolbarTab) => {
    e.preventDefault();
    e.stopPropagation();
    if (onHideTab) {
      setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id, tabLabel: tab.label });
    }
  };

  return (
    <div
      className='relative flex flex-col gap-2'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
          onContextMenu={(e) => handleContextMenu(e, tab)}
          variant='vertical'
          badge={tab.badge}
        />
      ))}
      {/* Collapse button at bottom - appears on hover, shorter to avoid dividers */}
      <button
        className={cn(
          'absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center',
          'w-12 h-3 bg-white/5 border border-white/10',
          'hover:bg-white/15 hover:border-fm-gold/50',
          'transition-all duration-300 cursor-pointer z-10',
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            toggleGroupCollapsed(group.group);
          }
        }}
        title={clickToExpandText}
      >
        <ChevronUp className='h-2.5 w-2.5 text-white/50 hover:text-fm-gold transition-colors duration-300' />
      </button>
      {/* Invisible hover extension below the button */}
      <div
        className='absolute -bottom-3 left-0 right-0 h-3'
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      />
      {/* Context menu */}
      {contextMenu && onHideTab && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tabId={contextMenu.tabId}
          tabLabel={contextMenu.tabLabel}
          onHide={() => onHideTab(contextMenu.tabId)}
          onClose={() => setContextMenu(null)}
          hideTabText={hideTabText}
        />
      )}
    </div>
  );
};

// Animated group tabs wrapper - handles staggered collapse/expand animations
interface AnimatedGroupTabsProps {
  group: { group: string; tabs: ToolbarTab[] };
  collapsed: boolean;
  activeTab: string | null;
  isDragging: boolean;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
  handleTabClick: (tabId: string) => void;
  onHideTab?: (tabId: string) => void;
  hideTabText?: string;
}

export const AnimatedGroupTabs = ({
  group,
  collapsed,
  activeTab,
  isDragging,
  toggleGroupCollapsed,
  clickToExpandText,
  handleTabClick,
  onHideTab,
  hideTabText,
}: AnimatedGroupTabsProps) => {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [collapseProgress, setCollapseProgress] = useState(collapsed ? 1 : 0);
  const [visibleTabs, setVisibleTabs] = useState<number[]>(
    collapsed ? [] : group.tabs.map((_, i) => i)
  );
  const [showFolder, setShowFolder] = useState(collapsed);
  const prevCollapsedRef = useRef(collapsed);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const groupLabel = group.tabs[0]?.groupLabel;
  const STAGGER_DELAY = 80; // ms between each tab animation

  useEffect(() => {
    // Detect collapse/expand transition
    if (prevCollapsedRef.current !== collapsed) {
      // Clear any pending animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      if (collapsed) {
        // Start collapsing animation - all tabs fade and shrink together
        setAnimationState('collapsing');
        setShowFolder(true);
        setCollapseProgress(0);

        // Smoothly animate the collapse progress
        const totalDuration = 250;
        const startTime = Date.now();

        const animateCollapse = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / totalDuration);
          // Ease-out curve
          const eased = 1 - Math.pow(1 - progress, 3);

          setCollapseProgress(eased);

          if (progress < 1) {
            requestAnimationFrame(animateCollapse);
          } else {
            setVisibleTabs([]);
            setAnimationState('idle');
          }
        };

        requestAnimationFrame(animateCollapse);

      } else {
        // Start expanding animation - tabs fly out one by one
        setAnimationState('expanding');
        setVisibleTabs([]);
        setCollapseProgress(1);

        // Animate tabs appearing from first to last
        group.tabs.forEach((_, i) => {
          setTimeout(() => {
            setVisibleTabs(prev => [...prev, i]);
          }, i * STAGGER_DELAY + 50);
        });

        // Hide folder after all tabs are visible
        animationTimeoutRef.current = setTimeout(() => {
          setShowFolder(false);
          setAnimationState('idle');
          setCollapseProgress(0);
        }, group.tabs.length * STAGGER_DELAY + 200);
      }
    }

    prevCollapsedRef.current = collapsed;

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [collapsed, group.tabs.length]);

  // If fully collapsed (no animation), just show folder
  if (collapsed && animationState === 'idle') {
    return (
      <CollapsedGroupTab
        groupName={group.group}
        tabs={group.tabs}
        groupLabel={groupLabel}
        activeTab={activeTab}
        isDragging={isDragging}
        toggleGroupCollapsed={toggleGroupCollapsed}
        clickToExpandText={clickToExpandText}
      />
    );
  }

  // If fully expanded (no animation), just show tabs with collapse button at bottom
  if (!collapsed && animationState === 'idle') {
    return (
      <ExpandedGroupWithCollapseButton
        group={group}
        activeTab={activeTab}
        isDragging={isDragging}
        handleTabClick={handleTabClick}
        toggleGroupCollapsed={toggleGroupCollapsed}
        clickToExpandText={clickToExpandText}
        onHideTab={onHideTab}
        hideTabText={hideTabText}
      />
    );
  }

  const isCollapsing = animationState === 'collapsing';

  // Calculate the height of expanded tabs vs collapsed folder
  // Each tab is 48px (h-12) with 8px gap, folder is 56px (h-14)
  const TAB_HEIGHT = 48;
  const GAP = 8;
  const FOLDER_HEIGHT = 56;
  const expandedHeight = group.tabs.length * TAB_HEIGHT + (group.tabs.length - 1) * GAP;

  // During animation, show both folder and visible tabs
  return (
    <div
      className='relative flex flex-col overflow-hidden'
      style={{
        // Animate height during collapse/expand for smooth layout transition
        height: isCollapsing
          ? `${FOLDER_HEIGHT + (expandedHeight - FOLDER_HEIGHT) * (1 - collapseProgress)}px`
          : animationState === 'expanding'
            ? `${expandedHeight}px`
            : 'auto',
        transition: isCollapsing ? 'none' : 'height 200ms ease-out',
      }}
    >
      {/* Animated tabs - positioned at top */}
      <div
        className='flex flex-col gap-2 absolute top-0 left-0 right-0'
        style={{
          // During collapse, fade and shrink toward bottom
          opacity: isCollapsing ? 1 - collapseProgress * 1.5 : 1,
          transform: isCollapsing
            ? `scale(${1 - collapseProgress * 0.2})`
            : 'none',
          transformOrigin: 'bottom center',
          pointerEvents: isCollapsing ? 'none' : 'auto',
        }}
      >
        {group.tabs.map((tab, index) => {
          const isVisible = visibleTabs.includes(index);

          // For expanding animation
          if (!isCollapsing) {
            return (
              <div
                key={tab.id}
                className={cn(
                  'transition-all duration-200 ease-out',
                  !isVisible && 'pointer-events-none'
                )}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateX(0) scale(1)'
                    : 'translateX(-20px) scale(0.8)',
                }}
              >
                <FmCommonTab
                  icon={tab.icon}
                  label={tab.label}
                  isActive={activeTab === tab.id}
                  onClick={() => {
                    if (!isDragging && isVisible) {
                      handleTabClick(tab.id);
                    }
                  }}
                  variant='vertical'
                  badge={tab.badge}
                />
              </div>
            );
          }

          // For collapsing animation - all tabs visible but fading
          return (
            <div key={tab.id} className='pointer-events-none'>
              <FmCommonTab
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => {}}
                variant='vertical'
                badge={tab.badge}
              />
            </div>
          );
        })}
      </div>

      {/* Folder - positioned at bottom of the animated container */}
      {showFolder && (
        <div
          className='absolute bottom-0 left-0'
          style={{
            opacity: isCollapsing ? Math.min(1, collapseProgress * 2) : (visibleTabs.length > 0 ? 0 : 1),
            transform: `scale(${isCollapsing ? 0.8 + collapseProgress * 0.2 : (visibleTabs.length > 0 ? 0.75 : 1)})`,
            transformOrigin: 'bottom left',
            transition: isCollapsing ? 'none' : 'all 200ms ease-out',
            zIndex: 10,
          }}
        >
          <CollapsedGroupTab
            groupName={group.group}
            tabs={group.tabs}
            groupLabel={groupLabel}
            activeTab={activeTab}
            isDragging={isDragging}
            toggleGroupCollapsed={toggleGroupCollapsed}
            clickToExpandText={clickToExpandText}
          />
        </div>
      )}
    </div>
  );
};
