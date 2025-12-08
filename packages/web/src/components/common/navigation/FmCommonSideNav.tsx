import { LucideIcon, ExternalLink } from 'lucide-react';
import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/common/shadcn/sidebar';
import { cn } from '@/shared/utils/utils';

export interface FmCommonSideNavItem<T = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: React.ReactNode;
  /** Mark this item as an external navigation (navigates to a new page) */
  isExternal?: boolean;
}

export interface FmCommonSideNavGroup<T = string> {
  label?: string;
  icon?: LucideIcon;
  items: FmCommonSideNavItem<T>[];
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

  return (
    <Sidebar
      className={cn('border-r border-white/20 bg-black/40', className)}
      collapsible='icon'
    >
      <SidebarContent className='pt-4'>
        {/* Toggle Button */}
        <div className='px-2 mb-4'>
          <SidebarTrigger
            className={cn(
              'hover:bg-fm-gold/20 transition-all duration-300',
              'hover:scale-105 active:scale-95',
              'hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]'
            )}
          />
        </div>

        {/* Navigation Groups */}
        {groups.map((group, groupIndex) => (
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
              {/* Group Label */}
              {group.label && open && (
                <SidebarGroupLabel
                  className={cn(
                    'text-white/90 px-4 flex items-center gap-2',
                    'rounded-md text-base font-semibold mb-1'
                  )}
                >
                  {group.icon && <group.icon className='h-4 w-4' />}
                  {group.label}
                </SidebarGroupLabel>
              )}

              {/* Group Items */}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(item => {
                    const isActive = activeItem === item.id;
                    const isPrevious = previousItem === item.id && !isActive;
                    const showRipple = clickedItem === item.id;
                    const isExternal = item.isExternal;

                    return (
                      <SidebarMenuItem key={item.id as string}>
                        <SidebarMenuButton
                          onClick={() => handleItemClick(item.id)}
                          className={cn(
                            'cursor-pointer transition-all duration-200',
                            'relative overflow-hidden',
                            open ? 'justify-start pl-4' : 'justify-center',
                            // External item styling - frosted glass background
                            isExternal && [
                              'bg-white/5 backdrop-blur-sm',
                              'border border-white/10',
                              'hover:bg-white/10 hover:border-white/20',
                              'hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]',
                            ],
                            // Hover effects (non-external, non-active)
                            !isActive &&
                              !isExternal &&
                              'hover:bg-white/5 hover:translate-x-0.5',
                            // Active state
                            isActive && [
                              'bg-fm-gold/20 text-fm-gold',
                              'hover:bg-fm-gold/30',
                              'shadow-[0_0_12px_rgba(212,175,55,0.2)]',
                              'border-l-2 border-fm-gold',
                            ],
                            // Previous item fade out
                            isPrevious && 'bg-fm-gold/20 animate-fade-out'
                          )}
                          tooltip={item.description || item.label}
                        >
                          {/* Icon with subtle animation */}
                          <item.icon
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              isActive && 'scale-110'
                            )}
                          />

                          {/* Label with fade animation */}
                          {open && (
                            <span
                              className={cn(
                                'ml-3 transition-all duration-200 flex items-center gap-1.5 flex-1',
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
                          )}

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
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
