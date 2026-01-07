import { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';

export interface MobileHorizontalTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface MobileHorizontalTabsProps {
  tabs: MobileHorizontalTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Mobile-only sticky horizontal tabs
 * Scrollable tabs that stick below the navigation bar
 * Only renders on mobile (< 768px)
 */
export const MobileHorizontalTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: MobileHorizontalTabsProps) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeTabRef.current;
      const containerWidth = container.offsetWidth;
      const activeLeft = activeElement.offsetLeft;
      const activeWidth = activeElement.offsetWidth;

      // Calculate scroll position to center the active tab
      const scrollPosition =
        activeLeft - containerWidth / 2 + activeWidth / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <div
      className={cn(
        'w-screen -ml-[calc((100vw-100%)/2)]',
        'z-30',
        'bg-black/80 backdrop-blur-lg',
        'border-b border-white/20',
        'md:hidden',
        className
      )}
    >
      <div
        ref={containerRef}
        className='flex items-center overflow-x-auto scrollbar-hide px-4 py-[10px]'
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-[5px]',
                'px-[20px] py-[10px]',
                'font-canela text-sm font-medium whitespace-nowrap',
                'transition-all duration-300',
                'rounded-none',
                // Inactive state: gold text, divider border
                'text-fm-gold',
                'border-r border-fm-gold/30 last:border-r-0',
                // Inactive hover: gold bg, black text
                'hover:bg-fm-gold hover:text-black',
                // Active state: gold border, gold text, semi-opaque white bg
                isActive && 'border border-fm-gold bg-white/10',
                // Active hover: gold bg, black text
                isActive && 'hover:bg-fm-gold hover:text-black'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    'w-[16px] h-[16px]',
                    'transition-colors duration-200'
                  )}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
