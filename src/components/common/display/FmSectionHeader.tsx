/**
 * FmSectionHeader
 *
 * Section header component with gold gradient title (gold to lighter gold).
 * Includes optional description and feathered gold divider.
 *
 * **Features:**
 * - Gold gradient text for section titles
 * - Optional description subtext
 * - Optional icon
 * - Feathered gold divider below
 *
 * **Usage:**
 * - Use for any section that needs a styled header
 * - Works well inside FmCommonCard or standalone
 * - Common in admin pages, forms, and detail views
 */

import { LucideIcon } from 'lucide-react';

import { FmFeatheredDivider } from '@/components/common/display/FmFeatheredDivider';
import { cn } from '@/shared';

interface FmSectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional description/help text */
  description?: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Whether to show divider below header (default: true) */
  showDivider?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const FmSectionHeader = ({
  title,
  description,
  icon: Icon,
  showDivider = true,
  className,
}: FmSectionHeaderProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          {Icon && (
            <Icon className='w-5 h-5 text-fm-gold/70 flex-shrink-0' />
          )}
          <h3 className='font-canela text-xl tracking-wide bg-gradient-to-r from-fm-gold to-fm-gold/50 bg-clip-text text-transparent'>
            {title}
          </h3>
        </div>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </div>
      {showDivider && <FmFeatheredDivider className='mt-3' />}
    </div>
  );
};

FmSectionHeader.displayName = 'FmSectionHeader';

/**
 * @deprecated Use FmSectionHeader instead. This alias is provided for backwards compatibility.
 */
export const FmFormSectionHeader = FmSectionHeader;
