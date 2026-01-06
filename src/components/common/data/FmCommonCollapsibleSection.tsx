import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared';

interface FmCommonCollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * FmCommonCollapsibleSection - A collapsible section with toggleable header
 *
 * Features:
 * - Clickable header to toggle expand/collapse
 * - Chevron icon that rotates smoothly
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
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between mb-4 group cursor-pointer'
      >
        <h3 className='font-canela text-lg text-white group-hover:text-fm-gold transition-colors'>
          {title}
        </h3>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-all duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

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
