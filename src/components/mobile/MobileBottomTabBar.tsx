import { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';

export interface MobileBottomTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface MobileBottomTabBarProps {
  tabs: MobileBottomTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Mobile-only bottom tab bar with horizontal scrolling
 * Replaces sidebar navigation on mobile devices
 * Only renders on mobile (< 768px)
 */
export const MobileBottomTabBar = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: MobileBottomTabBarProps) => {
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
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-black/80 backdrop-blur-lg',
        'border-t border-white/20',
        'md:hidden',
        'pb-[env(safe-area-inset-bottom)]', // iOS safe area
        className
      )}
    >
      <div
        ref={containerRef}
        className='flex items-center overflow-x-auto scrollbar-hide px-[10px] py-[10px]'
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
                'flex-shrink-0 flex flex-col items-center justify-center',
                'min-w-[80px] h-[50px]',
                'px-[10px] py-[5px]',
                'font-canela text-xs font-medium',
                'transition-all duration-200',
                'rounded-none',
                'border-b-2',
                isActive
                  ? 'bg-fm-gold text-black border-fm-gold'
                  : 'bg-transparent text-white/70 hover:text-fm-gold border-transparent hover:border-fm-gold/50'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    'w-[20px] h-[20px] mb-[5px]',
                    'transition-colors duration-200'
                  )}
                />
              )}
              <span className='truncate max-w-full'>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
