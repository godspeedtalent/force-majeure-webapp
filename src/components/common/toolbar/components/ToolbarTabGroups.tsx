import React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/shared';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { ToolbarTab } from '../FmToolbar';
import { AnimatedGroupTabs } from './ToolbarGroupAnimation';

interface TabGroup {
  group: string;
  tabs: ToolbarTab[];
}

interface GroupBracketLinesProps {
  group: TabGroup;
  showGroupLabel: string | null;
}

/** Renders the bracket lines connecting tabs in a group */
const GroupBracketLines = ({ group, showGroupLabel }: GroupBracketLinesProps) => (
  <>
    {/* Vertical line connecting items */}
    <div
      className={cn(
        'absolute transition-opacity duration-300',
        showGroupLabel === group.group ? 'opacity-100' : 'opacity-30'
      )}
      style={{
        left: '-12px',
        top: '24px',
        height: `${(group.tabs.length - 1) * 56}px`,
        width: '1px',
        background: 'rgba(255, 255, 255, 0.2)',
      }}
    />
    {/* Horizontal tick at first item */}
    <div
      className={cn(
        'absolute transition-opacity duration-300',
        showGroupLabel === group.group ? 'opacity-100' : 'opacity-30'
      )}
      style={{
        left: '-12px',
        top: '24px',
        width: '8px',
        height: '1px',
        background: 'rgba(255, 255, 255, 0.2)',
      }}
    />
    {/* Horizontal tick at last item */}
    <div
      className={cn(
        'absolute transition-opacity duration-300',
        showGroupLabel === group.group ? 'opacity-100' : 'opacity-30'
      )}
      style={{
        left: '-12px',
        top: `${24 + (group.tabs.length - 1) * 56}px`,
        width: '8px',
        height: '1px',
        background: 'rgba(255, 255, 255, 0.2)',
      }}
    />
  </>
);

interface GroupLabelProps {
  groupLabel: string;
  showGroupLabel: string | null;
  groupName: string;
  onClick?: () => void;
}

/** Renders the vertical group label text */
const GroupLabel = ({ groupLabel, showGroupLabel, groupName, onClick }: GroupLabelProps) => {
  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }
    : undefined;

  return (
    <div
      className={cn(
        'absolute transition-opacity duration-300',
        showGroupLabel === groupName ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        left: '-52px',
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <span
        className={cn(
          'text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide uppercase',
          onClick && 'cursor-pointer hover:text-fm-gold transition-colors'
        )}
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}
        onClick={handleClick}
      >
        {groupLabel}
      </span>
    </div>
  );
};

interface TopTabGroupsProps {
  groups: TabGroup[];
  activeTab: string | null;
  isDragging: boolean;
  isOpen: boolean;
  isTabHovered: boolean;
  showGroupLabel: string | null;
  handleTabClick: (tabId: string) => void;
  handleGroupMouseEnter: (groupName: string) => void;
  handleGroupMouseLeave: () => void;
  setIsTabHovered: (hovered: boolean) => void;
}

/** Renders the top-aligned tab groups */
export const TopTabGroups = ({
  groups,
  activeTab,
  isDragging,
  isOpen,
  isTabHovered,
  showGroupLabel,
  handleTabClick,
  handleGroupMouseEnter,
  handleGroupMouseLeave,
  setIsTabHovered,
}: TopTabGroupsProps) => {
  if (groups.length === 0) return null;

  return (
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
      {groups.map((group, groupIndex) => {
        const shouldShowLabel = groups.length >= 2;
        const groupLabel = group.tabs[0]?.groupLabel;

        return (
          <React.Fragment key={group.group}>
            {/* Horizontal divider between groups */}
            {groupIndex > 0 && (
              <div className='my-4 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent w-full' />
            )}
            <div
              className='relative flex flex-col gap-2'
              onMouseEnter={() => handleGroupMouseEnter(group.group)}
              onMouseLeave={handleGroupMouseLeave}
            >
              {/* Group bracket lines */}
              {shouldShowLabel && groupLabel && group.tabs.length > 1 && (
                <GroupBracketLines group={group} showGroupLabel={showGroupLabel} />
              )}

              {/* Group label - vertical text */}
              {shouldShowLabel && groupLabel && (
                <GroupLabel
                  groupLabel={groupLabel}
                  showGroupLabel={showGroupLabel}
                  groupName={group.group}
                />
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
                  badge={tab.badge}
                />
              ))}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface BottomTabGroupsProps {
  groups: TabGroup[];
  activeTab: string | null;
  isDragging: boolean;
  isOpen: boolean;
  isTabHovered: boolean;
  showGroupLabel: string | null;
  dragOffset: number;
  anchorOffset: number;
  collapsedGroups: string[];
  handleTabClick: (tabId: string) => void;
  handleGroupMouseEnter: (groupName: string) => void;
  handleGroupMouseLeave: () => void;
  handleMouseDown: (event: React.MouseEvent) => void;
  setIsTabHovered: (hovered: boolean) => void;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
  collapseGroupText: string;
  tabsContainerRef: React.RefObject<HTMLDivElement>;
}

/** Renders the bottom-aligned tab groups with collapse/expand functionality */
export const BottomTabGroups = ({
  groups,
  activeTab,
  isDragging,
  isOpen,
  isTabHovered,
  showGroupLabel,
  dragOffset,
  anchorOffset,
  collapsedGroups,
  handleTabClick,
  handleGroupMouseEnter,
  handleGroupMouseLeave,
  handleMouseDown,
  setIsTabHovered,
  toggleGroupCollapsed,
  clickToExpandText,
  collapseGroupText,
  tabsContainerRef,
}: BottomTabGroupsProps) => {
  if (groups.length === 0) return null;

  const isGroupCollapsed = (groupName: string) => collapsedGroups.includes(groupName);

  return (
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
      {groups.map((group, groupIndex) => {
        const shouldShowLabel = groups.length >= 2 || group.tabs.length > 1;
        const groupLabel = group.tabs[0]?.groupLabel;
        const collapsed = isGroupCollapsed(group.group);

        return (
          <React.Fragment key={group.group}>
            {/* Horizontal divider between groups */}
            {groupIndex > 0 && (
              <div className='my-4 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent w-full' />
            )}
            <div
              className='relative flex flex-col gap-2'
              onMouseEnter={() => handleGroupMouseEnter(group.group)}
              onMouseLeave={handleGroupMouseLeave}
            >
              {/* Invisible hover extension */}
              {shouldShowLabel && groupLabel && !collapsed && group.tabs.length > 1 && (
                <div
                  className='absolute inset-0 z-0'
                  style={{
                    top: '-20px',
                    left: '-60px',
                    right: '-4px',
                    bottom: '-4px',
                  }}
                />
              )}

              {/* Group bracket lines */}
              {shouldShowLabel && groupLabel && !collapsed && group.tabs.length > 1 && (
                <GroupBracketLines group={group} showGroupLabel={showGroupLabel} />
              )}

              {/* Collapse bar - appears on hover at the top of the group */}
              {shouldShowLabel && groupLabel && !collapsed && group.tabs.length > 1 && (
                <button
                  className={cn(
                    'absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center',
                    'w-12 h-3 bg-white/5 border border-white/10 hover:bg-white/15 hover:border-fm-gold/50',
                    'transition-all duration-300 cursor-pointer z-10',
                    showGroupLabel === group.group
                      ? 'opacity-100'
                      : 'opacity-0 pointer-events-none'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroupCollapsed(group.group);
                  }}
                  title={collapseGroupText}
                >
                  <ChevronDown className='h-2.5 w-2.5 text-white/50 hover:text-fm-gold' />
                </button>
              )}

              {/* Group label - vertical text */}
              {shouldShowLabel && groupLabel && !collapsed && (
                <GroupLabel
                  groupLabel={groupLabel}
                  showGroupLabel={showGroupLabel}
                  groupName={group.group}
                  onClick={() => toggleGroupCollapsed(group.group)}
                />
              )}

              {/* Tabs - animated collapse/expand */}
              <AnimatedGroupTabs
                group={group}
                collapsed={collapsed}
                activeTab={activeTab}
                isDragging={isDragging}
                toggleGroupCollapsed={toggleGroupCollapsed}
                clickToExpandText={clickToExpandText}
                handleTabClick={handleTabClick}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
