import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/shared';
import { ToolbarTab } from '../FmToolbar';

interface HiddenTabsIndicatorProps {
  hiddenTabs: ToolbarTab[];
  onShowTab: (tabId: string) => void;
  onShowAllTabs: () => void;
  showTabText: string;
  showAllTabsText: string;
  hiddenTabsText: string;
}

/**
 * A small group-tab-style indicator that appears when tabs are hidden.
 * Left-click restores all hidden tabs.
 * Right-click or hover opens a context menu to restore individual tabs.
 */
export const HiddenTabsIndicator = ({
  hiddenTabs,
  onShowTab,
  onShowAllTabs,
  showTabText,
  showAllTabsText,
  hiddenTabsText,
}: HiddenTabsIndicatorProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLButtonElement>(null);
  const isInitialRender = useRef(true);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) {
      isInitialRender.current = true;
      return undefined;
    }

    // Delay attaching the listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      isInitialRender.current = false;
    }, 100);

    const handleClickOutside = (event: MouseEvent) => {
      if (isInitialRender.current) return;

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        indicatorRef.current &&
        !indicatorRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  if (hiddenTabs.length === 0) {
    return null;
  }

  const openMenu = () => {
    if (indicatorRef.current) {
      const rect = indicatorRef.current.getBoundingClientRect();
      const menuWidth = 160; // min-w-[160px]
      // Position to the left of the indicator
      setMenuPosition({
        x: rect.left - menuWidth - 8, // 8px gap
        y: rect.top,
      });
    }
    setIsMenuOpen(true);
  };

  const handleIndicatorClick = () => {
    // Left-click opens the menu (same as hover/right-click)
    openMenu();
  };

  const handleShowAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowAllTabs();
    setIsMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu();
  };

  const handleShowTab = (tabId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowTab(tabId);
    setIsMenuOpen(false);
  };

  // Number of "stacked" layers to show (max 2 for visual clarity)
  const stackLayers = Math.min(hiddenTabs.length - 1, 2);

  return (
    <div className='relative'>
      {/* Stacked tab layers behind the main tab - smaller version */}
      {stackLayers > 0 &&
        Array.from({ length: stackLayers }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-10 h-10',
              'bg-black/40 backdrop-blur-sm border border-white/10',
              'transition-all duration-200'
            )}
            style={{
              // Stack offset: each layer is offset down and right
              bottom: `-${(i + 1) * 2}px`,
              right: `-${(i + 1) * 2}px`,
              zIndex: -1 - i,
            }}
          />
        ))}

      {/* Main tab - smaller than regular tabs (w-10 h-10 instead of w-12 h-12) */}
      <button
        ref={indicatorRef}
        className={cn(
          'relative flex items-center justify-center',
          'w-10 h-10 bg-black/70 backdrop-blur-md',
          'border border-white/20',
          'hover:border-fm-gold/50 hover:bg-black/80',
          'transition-all duration-300 cursor-pointer'
        )}
        onClick={handleIndicatorClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => {
          setIsHovered(true);
          // Open menu on hover after a short delay
          const timeoutId = setTimeout(() => {
            openMenu();
          }, 300);
          // Store timeout to clear on mouse leave
          (indicatorRef.current as HTMLButtonElement & { hoverTimeout?: ReturnType<typeof setTimeout> }).hoverTimeout =
            timeoutId;
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // Clear hover timeout
          const timeout = (indicatorRef.current as HTMLButtonElement & { hoverTimeout?: ReturnType<typeof setTimeout> })
            ?.hoverTimeout;
          if (timeout) {
            clearTimeout(timeout);
          }
        }}
        title={`${hiddenTabsText} (${hiddenTabs.length})`}
      >
        {/* EyeOff icon */}
        <EyeOff
          className={cn('h-4 w-4 transition-colors duration-200', isHovered || isMenuOpen ? 'text-fm-gold' : 'text-white')}
        />

        {/* Count badge - bottom left, square */}
        <div
          className={cn(
            'absolute -bottom-1 -left-1 flex items-center justify-center',
            'min-w-3 h-3 px-0.5 text-[8px] font-bold',
            'transition-colors duration-200',
            isHovered ? 'bg-black text-white ring-1 ring-white/60' : 'bg-white text-black ring-1 ring-white/20'
          )}
        >
          {hiddenTabs.length}
        </div>
      </button>

      {/* Context menu for restoring hidden tabs - rendered via portal */}
      {isMenuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-[9999]',
              'min-w-[160px] py-1',
              'bg-black/90 backdrop-blur-xl border border-white/20',
              'shadow-lg shadow-black/50',
              'animate-in fade-in zoom-in-95 duration-200'
            )}
            style={{ left: menuPosition.x, top: menuPosition.y }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setIsMenuOpen(false);
            }}
          >
            {/* Individual hidden tabs */}
            {hiddenTabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs',
                    'flex items-center gap-2',
                    'hover:bg-fm-gold/10 hover:text-fm-gold',
                    'transition-colors duration-200',
                    index % 2 === 0 ? 'bg-background/40' : 'bg-background/60'
                  )}
                  onClick={handleShowTab(tab.id)}
                  title={`${showTabText}: ${tab.label}`}
                >
                  <Icon className='h-3 w-3' />
                  <span className='truncate'>{tab.label}</span>
                </button>
              );
            })}

            {/* Unhide All option */}
            {hiddenTabs.length > 1 && (
              <>
                <div className='my-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent' />
                <button
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs',
                    'flex items-center gap-2',
                    'hover:bg-fm-gold/10 hover:text-fm-gold',
                    'transition-colors duration-200'
                  )}
                  onClick={handleShowAll}
                >
                  <Eye className='h-3 w-3' />
                  <span>{showAllTabsText}</span>
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
