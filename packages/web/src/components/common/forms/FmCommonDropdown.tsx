import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/common/shadcn/dropdown-menu';
import { cn } from '@/shared/utils/utils';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'muted';
  separator?: boolean;
  badge?: React.ReactNode;
}

export interface DropdownSection {
  label?: string; // Optional section header
  items: DropdownItem[];
}

interface FmCommonDropdownProps {
  trigger: React.ReactNode;
  /** Flat list of items (legacy support) */
  items?: DropdownItem[];
  /** Grouped sections with optional labels */
  sections?: DropdownSection[];
  align?: 'start' | 'center' | 'end';
  /** Hide the chevron indicator (useful for icon-only triggers like avatars) */
  hideChevron?: boolean;
}

/**
 * Renders a single dropdown item with consistent styling
 */
function DropdownItemRenderer({
  item,
  index,
  totalItems,
}: {
  item: DropdownItem;
  index: number;
  totalItems: number;
}) {
  return (
    <React.Fragment>
      {item.separator && (
        <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' />
      )}
      <DropdownMenuItem
        onClick={item.onClick}
        className={cn(
          'group cursor-pointer rounded-md my-0.5 relative',
          // Transparent backgrounds to let frosted glass show through
          index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]',
          'hover:bg-fm-gold/15 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white',
          'focus:bg-fm-gold/20 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white',
          'active:scale-[0.98] transition-all duration-300',
          item.variant === 'destructive' &&
            'text-destructive hover:bg-destructive/15 hover:shadow-destructive/20 focus:bg-destructive/20 focus:shadow-destructive/20 hover:text-destructive',
          item.variant === 'muted' &&
            'text-white/70 hover:bg-white/10 hover:shadow-white/10 focus:bg-white/15 focus:shadow-white/10 hover:text-white'
        )}
      >
        {item.icon && (
          <span className='mr-2 transition-transform duration-300 group-hover:scale-110'>
            <item.icon className='h-4 w-4' />
          </span>
        )}
        <span className='flex items-center flex-1 font-medium'>
          {item.label}
          {item.badge && <span className='ml-auto'>{item.badge}</span>}
        </span>
        {/* Horizontal divider after each item */}
        {index < totalItems - 1 && (
          <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' />
        )}
      </DropdownMenuItem>
    </React.Fragment>
  );
}

/**
 * Reusable dropdown component with consistent styling
 * Supports both flat items list and grouped sections
 */
export function FmCommonDropdown({
  trigger,
  items,
  sections,
  align = 'end',
  hideChevron = false,
}: FmCommonDropdownProps) {
  // Convert flat items to sections format for unified rendering
  const effectiveSections: DropdownSection[] = React.useMemo(() => {
    if (sections) return sections;
    if (items) return [{ items }];
    return [];
  }, [sections, items]);

  // Calculate total items for striping
  const allItems = effectiveSections.flatMap(s => s.items);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='w-full'>
        <div className='relative w-full cursor-pointer'>
          {trigger}
          {!hideChevron && (
            <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white/70 transition-colors' />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(
          'w-56 z-[200]',
          'bg-black/90 backdrop-blur-xl',
          'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50',
          'animate-in fade-in zoom-in-95 duration-200',
          'p-1'
        )}
      >
        {effectiveSections.map((section, sectionIndex) => {
          // Calculate global index offset for this section
          const previousItemsCount = effectiveSections
            .slice(0, sectionIndex)
            .reduce((acc, s) => acc + s.items.length, 0);

          return (
            <React.Fragment key={sectionIndex}>
              {/* Section divider (before all sections except first) */}
              {sectionIndex > 0 && (
                <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-[10px]' />
              )}

              {/* Section header */}
              {section.label && (
                <DropdownMenuLabel
                  className='px-[15px] py-[8px] text-[10px] uppercase tracking-[0.2em] text-fm-gold/70 font-normal'
                >
                  {section.label}
                </DropdownMenuLabel>
              )}

              {/* Section items */}
              <DropdownMenuGroup>
                {section.items.map((item, itemIndex) => (
                  <DropdownItemRenderer
                    key={item.label}
                    item={item}
                    index={previousItemsCount + itemIndex}
                    totalItems={allItems.length}
                  />
                ))}
              </DropdownMenuGroup>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
