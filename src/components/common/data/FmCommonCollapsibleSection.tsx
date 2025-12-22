import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';

interface FmCommonCollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * FmCommonCollapsibleSection - A collapsible section with toggle button
 *
 * Features:
 * - Toggle expand/collapse state
 * - Chevron icon that rotates
 * - Smooth slide down/up + fade in/out animations
 * - Optional default expanded state
 *
 * Usage:
 * ```tsx
 * <FmCommonCollapsibleSection title="Demo Tools" defaultExpanded={true}>
 *   <YourContent />
 * </FmCommonCollapsibleSection>
 * ```
 */
export const FmCommonCollapsibleSection = ({
  title,
  children,
  defaultExpanded = true,
  className = '',
}: FmCommonCollapsibleSectionProps) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-canela text-lg text-white'>{title}</h3>
        <Button
          variant='secondary'
          size='sm'
          onClick={() => setIsExpanded(!isExpanded)}
          className='text-white hover:text-fm-gold'
        >
          {isExpanded ? (
            <>
              <ChevronUp className='h-4 w-4 mr-1' />
              {t('collapsible.collapse')}
            </>
          ) : (
            <>
              <ChevronDown className='h-4 w-4 mr-1' />
              {t('collapsible.expand')}
            </>
          )}
        </Button>
      </div>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className='overflow-hidden'>{children}</div>
      </div>
    </div>
  );
};
