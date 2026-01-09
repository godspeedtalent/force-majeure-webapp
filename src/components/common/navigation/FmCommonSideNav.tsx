import { LucideIcon, ExternalLink } from 'lucide-react';
import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/common/shadcn/sidebar';
import { cn } from '@/shared';
import { FmCollapsibleGroupHeader, FmCollapsibleSubgroupHeader } from '@/components/common/data/FmCollapsibleGroupHeader';

export interface FmCommonSideNavItem<T = string> {
  id: T;
  label: React.ReactNode;
  icon: LucideIcon;
  description?: string;
  badge?: React.ReactNode;
  /** Mark this item as an external navigation (navigates to a new page) */
  isExternal?: boolean;
}

/** Subgroup within a main navigation group (H2 level) */
export interface FmCommonSideNavSubgroup<T = string> {
  label: string;
  icon?: LucideIcon;
  items: FmCommonSideNavItem<T>[];
  /** Start collapsed (default: false) */
  defaultCollapsed?: boolean;
}

export interface FmCommonSideNavGroup<T = string> {
  label?: string;
  icon?: LucideIcon;
  /** Direct items in this group (no subgroup nesting) */
  items?: FmCommonSideNavItem<T>[];
  /** Nested subgroups for hierarchical navigation (H1 > H2 structure) */
  subgroups?: FmCommonSideNavSubgroup<T>[];
  /** Admin-only group indicator */
  adminOnly?: boolean;
}

export interface FmCommonSideNavProps<T = string> {
  groups: FmCommonSideNavGroup<T>[];
  activeItem: T;
  onItemChange: (item: T) => void;
  className?: string;
  showDividers?: boolean;
}

/**
 * FmCommonSideNav - A beautiful, interactive side navigation component
 *
 * Features:
 * - Collapsible to icon-only mode
 * - Grouped navigation items with labels
 * - Gold highlight for active items
 * - Smooth animations and hover effects
 * - Ripple effects on click
 * - Tooltip support when collapsed
 * - Keyboard accessible
 */
export function FmCommonSideNav<T extends string = string>({
  groups,
  activeItem,
  onItemChange,
  className,
  showDividers = true,
}: FmCommonSideNavProps<T>) {
  const { open } = useSidebar();
  const [clickedItem, setClickedItem] = React.useState<T | null>(null);
  const [previousItem, setPreviousItem] = React.useState<T | null>(null);
  // Track collapsed state for each group by label
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  // Track item changes for fade-out effect
  React.useEffect(() => {
    if (activeItem !== previousItem) {
      setPreviousItem(activeItem);
    }
  }, [activeItem, previousItem]);

  const handleItemClick = (itemId: T) => {
    setClickedItem(itemId);
    onItemChange(itemId);

    // Clear ripple after animation
    setTimeout(() => {
      setClickedItem(null);
    }, 600);
  };

  const handleGroupToggle = (groupLabel: string, expanded: boolean) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupLabel]: !expanded,
    }));
  };

  // Render menu items for a group
  const renderMenuItems = (items: FmCommonSideNavItem<T>[]) => (
    <SidebarMenu>
      {items.map(item => {
        const isActive = activeItem === item.id;
        const isPrevious = previousItem === item.id && !isActive;
        const showRipple = clickedItem === item.id;
        const isExternal = item.isExternal;

        return (
          <SidebarMenuItem key={item.id as string}>
            <SidebarMenuButton
              onClick={() => handleItemClick(item.id)}
              className={cn(
                'cursor-pointer transition-all duration-300 ease-in-out',
                'relative overflow-hidden',
                open ? 'justify-start pl-4' : 'justify-center pl-2',
                // Base left border (transparent) to prevent layout shift on hover
                !isExternal && 'border-l-2 border-transparent',
                // External item styling - frosted glass background
                isExternal && [
                  'bg-white/5 backdrop-blur-sm',
                  'border border-white/10',
                  'hover:bg-white/10 hover:border-white/20',
                  'hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]',
                ],
                // Hover effects (non-external, non-active)
                !isActive &&
                  !isExternal && [
                    'hover:bg-white/5 hover:translate-x-0.5',
                    'hover:border-white',
                  ],
                // Active state
                isActive && [
                  'bg-fm-gold/20 text-fm-gold',
                  'hover:bg-fm-gold/30',
                  'shadow-[0_0_12px_rgba(212,175,55,0.2)]',
                  'border-fm-gold',
                ],
                // Previous item fade out
                isPrevious && 'bg-fm-gold/20 animate-fade-out'
              )}
              tooltip={item.description || (typeof item.label === 'string' ? item.label : undefined)}
            >
              {/* Icon with subtle animation */}
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-300',
                  isActive && 'scale-110'
                )}
              />

              {/* Label with smooth collapse animation */}
              <span
                className={cn(
                  'ml-3 flex items-center gap-1.5 flex-1 whitespace-nowrap',
                  'transition-all duration-300 ease-in-out',
                  open ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0 overflow-hidden',
                  isActive && 'font-semibold'
                )}
              >
                {item.label}
                {/* External link icon for external items */}
                {isExternal && (
                  <ExternalLink className='h-3 w-3 ml-auto text-white/50' />
                )}
                {item.badge && !isExternal && <span className='ml-auto'>{item.badge}</span>}
              </span>

              {/* Active indicator bar (subtle pulse) */}
              {isActive && (
                <div className='absolute inset-0 bg-gradient-to-r from-fm-gold/10 to-transparent animate-pulse' />
              )}

              {/* Ripple effect - only for clicked item */}
              {showRipple && (
                <span
                  className='absolute inset-0 bg-fm-gold/40 animate-ripple rounded-none'
                  style={{
                    transformOrigin: 'center',
                  }}
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar
      className={cn('border-white/20 bg-black/40 relative', className)}
      collapsible='icon'
    >
      {/* Toggle Button - floating, positioned on right edge when expanded */}
      <div
        className={cn(
          'absolute z-20',
          open ? 'top-2 right-2' : 'top-2 left-1/2 -translate-x-1/2'
        )}
      >
        <SidebarTrigger
          className={cn(
            'transition-all duration-300',
            'hover:bg-fm-gold/20 hover:scale-105 active:scale-95',
            'hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]',
            '[&>svg]:transition-colors [&>svg]:duration-300',
            '[&:hover>svg]:text-fm-gold'
          )}
        />
      </div>

      <SidebarContent className='pt-12'>
        {/* Navigation Groups */}
        {groups.map((group, groupIndex) => {
          const groupLabel = group.label || `group-${groupIndex}`;
          const isExpanded = !collapsedGroups[groupLabel];
          const hasSubgroups = group.subgroups && group.subgroups.length > 0;
          const hasItems = group.items && group.items.length > 0;
          const totalItemCount = hasSubgroups
            ? group.subgroups!.reduce((sum, sg) => sum + sg.items.length, 0)
            : (group.items?.length || 0);

          return (
            <div key={groupIndex}>
              {/* Divider between groups */}
              {showDividers &&
                groupIndex > 0 &&
                (open ? (
                  <div className='px-4 my-3'>
                    <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
                  </div>
                ) : (
                  <div className='px-2 my-3'>
                    <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
                  </div>
                ))}

              <SidebarGroup>
                {/* Group with Collapsible Header (when sidebar is open) */}
                {group.label && open ? (
                  <div className='px-2'>
                    <FmCollapsibleGroupHeader
                      title={group.label}
                      count={totalItemCount}
                      expanded={isExpanded}
                      onExpandedChange={(expanded) => handleGroupToggle(groupLabel, expanded)}
                      showDivider={true}
                      icon={group.icon}
                      size={hasSubgroups ? 'large' : 'default'}
                    >
                      <SidebarGroupContent>
                        {/* Render direct items if present */}
                        {hasItems && renderMenuItems(group.items!)}

                        {/* Render subgroups if present */}
                        {hasSubgroups && group.subgroups!.map((subgroup, subIndex) => {
                          const subgroupLabel = `${groupLabel}-${subgroup.label}`;
                          const isSubgroupExpanded = !collapsedGroups[subgroupLabel];

                          return (
                            <FmCollapsibleSubgroupHeader
                              key={subIndex}
                              title={subgroup.label}
                              count={subgroup.items.length}
                              icon={subgroup.icon}
                              expanded={isSubgroupExpanded}
                              onExpandedChange={(expanded) => handleGroupToggle(subgroupLabel, expanded)}
                              defaultExpanded={!subgroup.defaultCollapsed}
                            >
                              {renderMenuItems(subgroup.items)}
                            </FmCollapsibleSubgroupHeader>
                          );
                        })}
                      </SidebarGroupContent>
                    </FmCollapsibleGroupHeader>
                  </div>
                ) : (
                  /* When collapsed or no label, just show items */
                  <SidebarGroupContent>
                    {hasItems && renderMenuItems(group.items!)}
                    {hasSubgroups && group.subgroups!.flatMap(sg => sg.items).map(item => renderMenuItems([item]))}
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            </div>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
