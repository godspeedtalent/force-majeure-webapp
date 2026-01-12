/**
 * FmTabContentHeader
 *
 * Page-level header for tab content in SideNavbarLayout pages.
 * Uses gold gradient styling for consistency with section headers.
 *
 * **Features:**
 * - Gold gradient title text (gold to lighter gold)
 * - Optional subtitle/description
 * - Optional icon
 * - Optional feathered gold divider
 * - Larger sizing for page-level prominence
 *
 * **When to use:**
 * - Event management page title (event name)
 * - Admin page titles (database table names)
 * - Any tab content that needs a prominent header
 */

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { FmFeatheredDivider } from '@/components/common/display/FmFeatheredDivider';
import { cn } from '@/shared';

interface FmTabContentHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle/description below the title */
  subtitle?: string;
  /** Optional icon displayed before title */
  icon?: LucideIcon;
  /** Whether to show divider below header (default: true) */
  showDivider?: boolean;
  /** Additional elements to render on the right side (e.g., badges, buttons) */
  actions?: ReactNode;
  /** Badge element to render centered on the divider */
  centeredBadge?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Size variant: 'default' for standard pages, 'large' for main entity pages */
  size?: 'default' | 'large';
}

export const FmTabContentHeader = ({
  title,
  subtitle,
  icon: Icon,
  showDivider = true,
  actions,
  centeredBadge,
  className,
  size = 'default',
}: FmTabContentHeaderProps) => {
  const isLarge = size === 'large';

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1 min-w-0 flex-1'>
          <div className='flex items-center gap-3'>
            {Icon && (
              <Icon
                className={cn(
                  'text-fm-gold/70 flex-shrink-0',
                  isLarge ? 'w-7 h-7' : 'w-6 h-6'
                )}
              />
            )}
            <h1
              className={cn(
                'font-canela tracking-wide bg-gradient-to-r from-fm-gold to-fm-gold/50 bg-clip-text text-transparent truncate',
                isLarge ? 'text-4xl' : 'text-3xl'
              )}
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className={cn(
              'text-muted-foreground',
              isLarge ? 'text-base' : 'text-sm'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className='flex items-center gap-2 flex-shrink-0'>
            {actions}
          </div>
        )}
      </div>
      {showDivider && (
        <div className='relative'>
          <FmFeatheredDivider />
          {centeredBadge && (
            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3'>
              {centeredBadge}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

FmTabContentHeader.displayName = 'FmTabContentHeader';