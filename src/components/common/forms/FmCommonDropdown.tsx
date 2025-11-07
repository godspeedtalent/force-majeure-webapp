import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  separator?: boolean;
}

interface FmCommonDropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
}

/**
 * Reusable dropdown component with consistent styling
 */
export function FmCommonDropdown({
  trigger,
  items,
  align = 'end',
}: FmCommonDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='w-full'>
        <div className='relative w-full cursor-pointer'>
          {trigger}
          <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white/70 transition-colors' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className='w-48 z-[200]'>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={
                item.variant === 'destructive' ? 'text-destructive' : ''
              }
            >
              {item.icon && <item.icon className='mr-2 h-4 w-4' />}
              {item.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
