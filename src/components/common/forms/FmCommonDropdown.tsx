import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { cn } from '@/shared/utils/utils';
import { getListItemClasses, getDepthClasses } from '@/shared/utils/styleUtils';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'muted';
  separator?: boolean;
  badge?: React.ReactNode;
}

interface FmCommonDropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
  /** Hide the chevron indicator (useful for icon-only triggers like avatars) */
  hideChevron?: boolean;
}

/**
 * Reusable dropdown component with consistent styling
 */
export function FmCommonDropdown({
  trigger,
  items,
  align = 'end',
  hideChevron = false,
}: FmCommonDropdownProps) {
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
          getDepthClasses(3),
          'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50',
          'animate-in fade-in zoom-in-95 duration-200',
          'p-1'
        )}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator && (
              <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' />
            )}
            <DropdownMenuItem
              onClick={item.onClick}
              className={cn(
                'group cursor-pointer rounded-md my-0.5 relative',
                getListItemClasses(index),
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
              {index < items.length - 1 && (
                <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' />
              )}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
