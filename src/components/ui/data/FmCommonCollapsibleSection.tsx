import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';

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
 * - Smooth animations
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-canela text-lg text-white">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:text-fm-gold"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Expand
            </>
          )}
        </Button>
      </div>

      {isExpanded && <div className="animate-slide-down-in">{children}</div>}
    </div>
  );
};
