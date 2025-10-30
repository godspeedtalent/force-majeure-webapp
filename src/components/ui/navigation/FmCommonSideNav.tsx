import { LucideIcon } from 'lucide-react';
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
} from '@/components/ui/shadcn/sidebar';
import { cn } from '@/shared/utils/utils';
import { useRipple } from '@/hooks/useRipple';

export interface FmCommonSideNavItem<T = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  description?: string;
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
  const { open, toggleSidebar } = useSidebar();
  const { ripples, createRipple } = useRipple();

  return (
    <Sidebar
      className={cn(
        'border-r border-white/20 bg-black/40',
        className
      )}
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        {/* Toggle Button */}
        <div className="px-2 mb-4">
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
            {showDividers && groupIndex > 0 && (
              open ? (
                <div className="px-4 my-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              ) : (
                <div className="px-2 my-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              )
            )}

            <SidebarGroup>
              {/* Group Label */}
              {group.label && open && (
                <SidebarGroupLabel
                  className={cn(
                    'text-white/90 px-4 flex items-center gap-2',
                    'cursor-pointer hover:bg-white/5 transition-all duration-200',
                    'rounded-md text-base font-semibold mb-1',
                    'hover:text-fm-gold hover:translate-x-0.5'
                  )}
                  onClick={toggleSidebar}
                >
                  {group.icon && <group.icon className="h-4 w-4" />}
                  {group.label}
                </SidebarGroupLabel>
              )}

              {/* Group Items */}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = activeItem === item.id;

                    return (
                      <SidebarMenuItem key={item.id as string}>
                        <SidebarMenuButton
                          onClick={(e) => {
                            createRipple(e as any);
                            onItemChange(item.id);
                          }}
                          className={cn(
                            'cursor-pointer transition-all duration-200',
                            'relative overflow-hidden',
                            open ? 'justify-start pl-4' : 'justify-center',
                            // Hover effects
                            !isActive && 'hover:bg-white/5 hover:translate-x-0.5',
                            // Active state
                            isActive && [
                              'bg-fm-gold/20 text-fm-gold',
                              'hover:bg-fm-gold/30',
                              'shadow-[0_0_12px_rgba(212,175,55,0.2)]',
                              'border-l-2 border-fm-gold',
                            ]
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
                                'ml-3 transition-all duration-200',
                                isActive && 'font-semibold'
                              )}
                            >
                              {item.label}
                            </span>
                          )}

                          {/* Active indicator bar (subtle pulse) */}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-fm-gold/10 to-transparent animate-pulse" />
                          )}

                          {/* Ripple effects */}
                          {ripples.map(ripple => (
                            <span
                              key={ripple.id}
                              className="absolute rounded-full bg-fm-gold/40 animate-ripple"
                              style={{
                                left: ripple.x,
                                top: ripple.y,
                                width: 10,
                                height: 10,
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          ))}
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
