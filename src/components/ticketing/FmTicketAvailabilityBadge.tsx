import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
import { cn } from '@/shared';

export interface FmTicketAvailabilityBadgeProps {
  /** Available inventory count */
  available: number;
  /** Total capacity */
  total: number;
  /** Show exact count (e.g., "12 remaining") vs generic ("Limited") */
  showExactCount?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

/**
 * FmTicketAvailabilityBadge
 *
 * Displays availability status for a ticket tier:
 * - "SOLD OUT" when no tickets available
 * - "X remaining" or "Almost sold out" when < 10% remaining
 * - "Limited" when < 25% remaining
 * - Hidden otherwise (tickets widely available)
 *
 * @example
 * ```tsx
 * <FmTicketAvailabilityBadge
 *   available={5}
 *   total={100}
 *   showExactCount
 * />
 * // Renders: "5 remaining" badge
 * ```
 */
export const FmTicketAvailabilityBadge = ({
  available,
  total,
  showExactCount = true,
  size = 'sm',
  className,
}: FmTicketAvailabilityBadgeProps) => {
  const { t } = useTranslation('common');

  // Calculate availability percentage
  const percentAvailable = total > 0 ? (available / total) * 100 : 100;

  // Determine status
  const getStatus = (): {
    show: boolean;
    label: string;
    variant: 'destructive' | 'warning' | 'secondary';
    className: string;
  } | null => {
    // Sold out
    if (available === 0 && total > 0) {
      return {
        show: true,
        label: t('ticketStatus.soldOut'),
        variant: 'destructive',
        className: 'bg-fm-danger/20 text-fm-danger border-fm-danger/30',
      };
    }

    // Almost sold out (< 10% remaining)
    if (percentAvailable < 10) {
      return {
        show: true,
        label: showExactCount
          ? t('ticketStatus.xRemaining', { count: available })
          : t('ticketStatus.almostSoldOut'),
        variant: 'warning',
        className: 'bg-fm-gold/20 text-fm-gold border-fm-gold/30',
      };
    }

    // Limited availability (< 25% remaining)
    if (percentAvailable < 25) {
      return {
        show: true,
        label: showExactCount
          ? t('ticketStatus.xRemaining', { count: available })
          : t('ticketStatus.limited'),
        variant: 'secondary',
        className: 'bg-white/10 text-muted-foreground border-white/20',
      };
    }

    // Tickets widely available - don't show badge
    return null;
  };

  const status = getStatus();

  // Don't render if not needed
  if (!status || !status.show) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'uppercase font-semibold rounded-none',
        sizeClasses[size],
        status.className,
        className
      )}
    >
      {status.label}
    </Badge>
  );
};
