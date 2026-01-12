import { useTranslation } from 'react-i18next';
import { Ticket, AlertCircle, CheckCircle2, PartyPopper } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmInventoryProgressBar } from '@/components/common/feedback/FmInventoryProgressBar';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/shared';
import type { TierInventoryStats } from '@/features/events/hooks/useEventInventory';

/**
 * Celebratory sold out box shadow - matches FmBigButton hover effects
 */
const SOLD_OUT_GLOW = '0 0 24px rgb(223 186 125 / 0.25), 0 0 12px rgb(223 186 125 / 0.15), inset 0 0 20px rgb(223 186 125 / 0.08)';

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
            'transition-all duration-300 relative overflow-hidden',
            !tier.isActive && 'opacity-50',
            // Celebratory styling for sold out tiers - matches FmBigButton hover effects
            tier.isSoldOut && 'border-2 border-fm-gold/70 bg-fm-gold/5'
          )}
          style={tier.isSoldOut ? { boxShadow: SOLD_OUT_GLOW } : undefined}
        >
          {/* Animated border shimmer for sold out tiers */}
          {tier.isSoldOut && (
            <>
              <div
                className="absolute inset-0 border-2 border-transparent pointer-events-none opacity-100 motion-safe:animate-[border-glow_3s_ease-in-out_infinite]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgb(223 186 125 / 0.3), transparent) border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              {/* Subtle inner shimmer */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-fm-gold/10 to-transparent pointer-events-none motion-safe:animate-[shimmer_3s_ease-in-out_infinite]"
              />
            </>
          )}

          <FmCommonCardContent className="p-4 relative z-10">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-none',
                  tier.isSoldOut
                    ? 'bg-fm-success/20'
                    : tier.isLowStock
                      ? 'bg-fm-gold/20'
                      : 'bg-green-500/20'
                )}>
                  {tier.isSoldOut ? (
                    <PartyPopper className="w-4 h-4 text-fm-success" />
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
                  <Badge className="bg-fm-success/20 text-fm-success border-fm-success/30 uppercase text-xs font-canela tracking-wider">
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
