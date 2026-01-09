/**
 * FmFormSection
 *
 * Unified form section component that combines:
 * - Gold gradient section header (gold to lighter gold)
 * - Optional description subtext
 * - Feathered gold divider
 * - FmCommonCard container with gold border on hover
 *
 * **Features:**
 * - Layout options (stack, grid-2, grid-3)
 * - Optional icon support
 * - Consistent form section styling
 * - Gold border hover effect on cards
 *
 * **When to use:**
 * - For any form section that needs a styled header with card container
 * - Management forms (Artist, Venue, User, Organization)
 * - Settings pages with grouped fields
 */

import { LucideIcon } from 'lucide-react';
import * as React from 'react';

import {
  FmCommonCard,
  FmCommonCardContent,
} from '@/components/common/display/FmCommonCard';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { cn } from '@/shared';

interface FmFormSectionProps {
  /** Section title (displayed with gold-white gradient) */
  title: string;
  /** Optional description/help text below title */
  description?: string;
  /** Optional icon displayed before title */
  icon?: LucideIcon;
  /** Form field children */
  children: React.ReactNode;
  /** Layout for form fields */
  layout?: 'stack' | 'grid-2' | 'grid-3';
  /** Whether to show divider below header (default: true) */
  showDivider?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the card */
  cardClassName?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Card variant */
  variant?: 'default' | 'frosted';
  /** Enable hover effects on card (default: true for gold border on hover) */
  hoverable?: boolean;
}

const layoutClasses = {
  stack: 'space-y-4',
  'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
  'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
};

export const FmFormSection = React.forwardRef<HTMLDivElement, FmFormSectionProps>(
  (
    {
      title,
      description,
      icon,
      children,
      layout = 'stack',
      showDivider = true,
      className,
      cardClassName,
      contentClassName,
      variant = 'default',
      hoverable = true,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        <FmCommonCard
          variant={variant}
          hoverable={hoverable}
          className={cn('p-6', cardClassName)}
        >
          <FmSectionHeader
            title={title}
            description={description}
            icon={icon}
            showDivider={showDivider}
          />
          <FmCommonCardContent
            className={cn(
              layoutClasses[layout],
              'pt-6 px-0 pb-0',
              contentClassName
            )}
          >
            {children}
          </FmCommonCardContent>
        </FmCommonCard>
      </div>
    );
  }
);

FmFormSection.displayName = 'FmFormSection';
