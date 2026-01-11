import { useTranslation } from 'react-i18next';
import { Ticket, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmInventoryProgressBar } from '@/components/common/feedback/FmInventoryProgressBar';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/shared';
import type { TierInventoryStats } from '@/features/events/hooks/useEventInventory';

interface TierInventoryListProps {
  tiers: TierInventoryStats[];
  /** Show inactive tiers (grayed out) */
  showInactive?: boolean;
}

/**
 * TierInventoryList
 *
 * Displays a list of ticket tiers with their inventory status.
 * Each tier shows:
 * - Name and price
 * - Progress bar showing sold/remaining
 * - Sold out or low stock badges
 */
export const TierInventoryList = ({
  tiers,
  showInactive = true,
}: TierInventoryListProps) => {
  const { t } = useTranslation('common');

  const displayTiers = showInactive ? tiers : tiers.filter((t) => t.isActive);

  if (displayTiers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{t('ticketStatus.noTiersConfigured')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayTiers.map((tier) => (
        <FmCommonCard
          key={tier.tierId}
          className={cn(
            'transition-all duration-300',
            !tier.isActive && 'opacity-50'
          )}
        >
          <FmCommonCardContent className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-none',
                  tier.isSoldOut
                    ? 'bg-fm-danger/20'
                    : tier.isLowStock
                      ? 'bg-fm-gold/20'
                      : 'bg-green-500/20'
                )}>
                  {tier.isSoldOut ? (
                    <AlertCircle className="w-4 h-4 text-fm-danger" />
                  ) : tier.isLowStock ? (
                    <AlertCircle className="w-4 h-4 text-fm-gold" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    {tier.tierName}
                    {!tier.isActive && (
                      <Badge variant="outline" className="text-xs">
                        {t('ticketStatus.inactive')}
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(tier.priceCents)}
                  </p>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2">
                {tier.isSoldOut ? (
                  <Badge variant="destructive" className="uppercase text-xs">
                    {t('ticketStatus.soldOut')}
                  </Badge>
                ) : tier.isLowStock ? (
                  <Badge className="bg-fm-gold/20 text-fm-gold border-fm-gold/30 uppercase text-xs">
                    {t('ticketStatus.lowStock')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {tier.percentSold}% {t('ticketStatus.sold').toLowerCase()}
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <FmInventoryProgressBar
              sold={tier.sold}
              total={tier.totalCapacity}
              reserved={tier.reserved}
              showLabels
              size="sm"
              showSoldOutBadge={false}
            />

            {/* Stats row */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  <span className="font-medium text-foreground">{tier.sold}</span> {t('ticketStatus.sold').toLowerCase()}
                </span>
                {tier.reserved > 0 && (
                  <span>
                    <span className="font-medium text-foreground">{tier.reserved}</span> {t('ticketStatus.reserved').toLowerCase()}
                  </span>
                )}
              </div>
              <span>
                <span className="font-medium text-foreground">{tier.available}</span> {t('ticketStatus.available').toLowerCase()}
              </span>
            </div>
          </FmCommonCardContent>
        </FmCommonCard>
      ))}
    </div>
  );
};
