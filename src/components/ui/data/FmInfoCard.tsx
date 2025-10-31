import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Card } from '@/components/ui/shadcn/card';
import { cn } from '@/shared/utils/utils';

interface FmInfoCardProps {
  icon: LucideIcon;
  title?: string;
  description?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
}

/**
 * FmInfoCard - A styled card component with icon, title, and content
 *
 * Features:
 * - Consistent gold-accented border styling
 * - Icon with gold color
 * - Optional title and description
 * - Flexible content area via children
 * - Matches the design pattern used in checkout forms
 *
 * Usage:
 * ```tsx
 * <FmInfoCard
 *   icon={Shield}
 *   title="Ticket Protection"
 *   description="Get a full refund if you can't attend..."
 * >
 *   <Button>Add Protection</Button>
 * </FmInfoCard>
 * ```
 */
export const FmInfoCard = ({
  icon: Icon,
  title,
  description,
  children,
  className,
  iconClassName,
}: FmInfoCardProps) => {
  return (
    <Card className={cn('p-6 bg-muted/20 border-fm-gold/30', className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 text-fm-gold mt-0.5 flex-shrink-0', iconClassName)} />
        <div className="flex-1">
          {title && <h3 className="font-medium text-sm mb-1">{title}</h3>}
          {description && (
            typeof description === 'string' ? (
              <p className="text-xs text-muted-foreground mb-3">{description}</p>
            ) : (
              <div className="text-xs text-muted-foreground mb-3">{description}</div>
            )
          )}
          {children}
        </div>
      </div>
    </Card>
  );
};
