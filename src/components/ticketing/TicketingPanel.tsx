import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Gift, LogIn, Tag, Ticket } from 'lucide-react';

import { FmCommonCard, FmCommonCardHeader, FmCommonCardTitle, FmCommonCardDescription, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmPromoCodeInput } from '@/components/common/misc/FmPromoCodeInput';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { Button } from '@/components/common/shadcn/button';
import { Label } from '@/components/common/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Separator } from '@/components/common/shadcn/separator';
import { useAuth } from '@/features/auth/services/AuthContext';
import { cn } from '@/shared';
import { formatHeader } from '@/shared';

import { FmTicketTierList } from '@/components/ticketing/FmTicketTierList';
import { useTicketFees } from './hooks/useTicketFees';

export interface TicketTierOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  total_tickets: number;
  available_inventory: number;
  tier_order: number;
  is_active: boolean;
  hide_until_previous_sold_out: boolean;
}

interface TicketingPanelProps {
  tiers: TicketTierOption[];
  onPurchase?: (selections: { tierId: string; quantity: number }[]) => void;
  isLoading?: boolean;
  initialSelections?: Record<string, number>;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
}

export const TicketingPanel = ({
  tiers,
  onPurchase,
  isLoading = false,
  initialSelections,
}: TicketingPanelProps) => {
  const { t } = useTranslation('common');
  const [selections, setSelections] = useState<Record<string, number>>(
    () => initialSelections ?? {}
  );
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      'General Admission': true,
      VIP: true,
    }
  );
  const { calculateFees, getTotalFees } = useTicketFees();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setSelections(initialSelections ?? {});
  }, [initialSelections]);

  const sortedTiers = [...tiers].sort((a, b) => a.tier_order - b.tier_order);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center gap-[10px] py-16 text-muted-foreground'>
        <div className='h-8 w-8 animate-spin rounded-none border-2 border-fm-gold border-t-transparent' />
        <p className='text-sm'>{t('ticketingPanel.loadingTickets')}</p>
      </div>
    );
  }

  const isTierVisible = (tier: TicketTierOption, index: number): boolean => {
    if (!tier.is_active) return false;

    if (tier.hide_until_previous_sold_out && index > 0) {
      const previousTier = sortedTiers[index - 1];
      return previousTier.available_inventory === 0;
    }

    return true;
  };

  const isSoldOut = (tier: TicketTierOption): boolean => {
    return tier.available_inventory === 0;
  };

  const getRemainingTickets = (tier: TicketTierOption): number => {
    return Math.max(0, tier.available_inventory);
  };

  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelections(prev => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const handlePurchase = () => {
    const purchaseSelections = Object.entries(selections)
      .filter(([, quantity]) => quantity > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity }));

    if (purchaseSelections.length > 0 && onPurchase) {
      onPurchase(purchaseSelections);
    }
  };

  const calculateSubtotal = (): number => {
    return Object.entries(selections).reduce((total, [tierId, quantity]) => {
      const tier = tiers.find(t => t.id === tierId);
      return total + (tier ? tier.price * quantity : 0);
    }, 0);
  };

  const calculatePromoDiscount = (subtotal: number): number => {
    if (!promoCode || subtotal === 0) return 0;

    if (promoCode.discount_type === 'percentage') {
      const discount = (subtotal * Number(promoCode.discount_value)) / 100;
      return Math.min(discount, subtotal);
    }

    return Math.min(Number(promoCode.discount_value), subtotal);
  };

  const calculateFinalTicketPrice = (basePrice: number): number => {
    const baseFees = calculateFees(basePrice);
    const totalFeesForTicket = baseFees.reduce(
      (sum, fee) => sum + fee.amount,
      0
    );
    return basePrice + totalFeesForTicket;
  };

  const groupTiers = () => {
    const groups: Record<string, TicketTierOption[]> = {
      'General Admission': [],
      VIP: [],
    };

    sortedTiers.forEach(tier => {
      if (
        tier.name.toLowerCase().includes('table') ||
        tier.name.toLowerCase().includes('vip')
      ) {
        groups.VIP.push(tier);
      } else {
        groups['General Admission'].push(tier);
      }
    });

    Object.keys(groups).forEach(key => {
      const visibleTiers = groups[key].filter(tier => {
        const idx = sortedTiers.findIndex(t => t.id === tier.id);
        return isTierVisible(tier, idx);
      });
      if (visibleTiers.length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

  const tiersGrouped = groupTiers();

  const getPriceBreakdown = (basePrice: number) => {
    const baseFees = calculateFees(basePrice);
    const breakdown = [
      { label: t('ticketingPanel.basePrice'), amount: basePrice },
      ...baseFees.map(fee => ({
        label: fee.name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()),
        amount: fee.amount,
      })),
    ];
    const total =
      basePrice + baseFees.reduce((sum, fee) => sum + fee.amount, 0);
    return { breakdown, total };
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const subtotal = calculateSubtotal();
  const promoDiscount = calculatePromoDiscount(subtotal);
  const subtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
  const fees = calculateFees(subtotalAfterPromo);
  const totalFees = getTotalFees(subtotalAfterPromo);
  const grandTotal = Math.max(0, subtotalAfterPromo + totalFees);
  const hasSelections = Object.values(selections).some(qty => qty > 0);

  const ticketSelections = Object.entries(selections)
    .filter(([, quantity]) => quantity > 0)
    .map(([tierId, quantity]) => {
      const tier = tiers.find(t => t.id === tierId)!;
      return {
        tier,
        quantity,
        subtotal: tier.price * quantity,
      };
    });

  const handlePromoCodeApplied = (promo: PromoCode | null) => {
    setPromoCode(promo);
  };

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='flex items-center gap-[10px] text-foreground font-canela text-xl mb-1'>
          <Ticket className='h-5 w-5 text-fm-gold' />
          {formatHeader(t('ticketingPanel.selectYourTickets'))}
        </h3>
        <p className='text-sm text-muted-foreground'>
          {t('ticketingPanel.chooseQuantity')}
        </p>
        <div className='mt-2 px-[10px] py-[10px] bg-fm-gold/10 border border-fm-gold/30 rounded-none'>
          <p className='text-xs text-fm-gold'>
            {t('ticketingPanel.pricesIncludeFees')}
          </p>
        </div>
      </div>

      <div className='space-y-4'>
        {sortedTiers.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            {t('ticketingPanel.noTiersAvailable')}
          </div>
        ) : (
          Object.entries(tiersGrouped).map(([groupName, groupTiers]) => (
            <div key={groupName} className='space-y-2'>
              <button
                onClick={() => toggleGroup(groupName)}
                className='w-full flex items-center justify-between px-[10px] py-[10px] bg-muted/30 hover:bg-muted/50 rounded-none transition-colors'
              >
                <span className='text-sm font-medium text-foreground'>
                  {groupName}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    expandedGroups[groupName] ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </button>

              {expandedGroups[groupName] && (
                <div className='space-y-0 border border-border rounded-none overflow-visible relative'>
                  {groupTiers.map((tier, tierIndex) => {
                    const globalIndex = sortedTiers.findIndex(
                      t => t.id === tier.id
                    );
                    const isVisible = isTierVisible(tier, globalIndex);
                    const soldOut = isSoldOut(tier);
                    const remaining = getRemainingTickets(tier);

                    if (!isVisible) return null;

                    return (
                      <div key={tier.id}>
                        <div
                          className={cn(
                            'group transition-colors hover:bg-muted/40',
                            tierIndex % 2 === 1 && 'bg-white/5'
                          )}
                        >
                          <div className='flex items-start justify-between gap-[20px] px-[10px] py-[10px]'>
                            <div className='flex-1 space-y-1'>
                              <h3 className='font-medium text-xs text-foreground'>
                                {tier.name}
                              </h3>
                              {tier.description && (
                                <p className='text-xs italic text-muted-foreground'>
                                  {tier.description}
                                </p>
                              )}
                              {soldOut && (
                                <span className='text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium inline-block'>
                                  {t('status.soldOut').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-[10px]'>
                              <div className='relative group/price'>
                                <span className='text-xs text-fm-gold cursor-help'>
                                  $
                                  {calculateFinalTicketPrice(
                                    tier.price
                                  ).toFixed(2)}
                                </span>
                                <div className='absolute right-0 bottom-full mb-2 hidden group-hover/price:block bg-popover text-popover-foreground px-[10px] py-[10px] rounded-none border border-border shadow-lg whitespace-nowrap z-50 min-w-[200px]'>
                                  <div className='text-xs font-medium mb-2 text-foreground'>
                                    {t('ticketingPanel.priceBreakdown')}
                                  </div>
                                  <div className='space-y-1'>
                                  {getPriceBreakdown(
                                    tier.price
                                  ).breakdown.map((item) => (
                                    <div
                                      key={item.label}
                                        className='flex justify-between text-xs'
                                      >
                                        <span className='text-muted-foreground'>
                                          {item.label}:
                                        </span>
                                        <span className='text-foreground'>
                                          ${item.amount.toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                    <div className='border-t border-border pt-1 mt-1'>
                                      <div className='flex justify-between text-xs font-medium'>
                                        <span className='text-foreground'>
                                          {t('labels.total')}:
                                        </span>
                                        <span className='text-fm-gold'>
                                          $
                                          {getPriceBreakdown(
                                            tier.price
                                          ).total.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className='flex items-center gap-[10px]'>
                                <Label
                                  htmlFor={`qty-${tier.id}`}
                                  className='text-xs uppercase text-muted-foreground'
                                >
                                  {t('ticketingPanel.qty')}:
                                </Label>
                                <Select
                                  value={selections[tier.id]?.toString() || '0'}
                                  onValueChange={value =>
                                    handleQuantityChange(
                                      tier.id,
                                      parseInt(value)
                                    )
                                  }
                                  disabled={soldOut || remaining === 0}
                                >
                                  <SelectTrigger
                                    id={`qty-${tier.id}`}
                                    className={cn(
                                      'w-14 h-7 bg-background border-border text-xs',
                                      'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                                      'disabled:cursor-not-allowed disabled:opacity-50'
                                    )}
                                  >
                                    <SelectValue placeholder='0' />
                                  </SelectTrigger>
                                  <SelectContent className='bg-popover border-border z-50 min-w-[80px]'>
                                    <SelectItem value='0'>0</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                      <SelectItem
                                        key={num}
                                        value={num.toString()}
                                        disabled={num > remaining}
                                      >
                                        {num}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                        {tierIndex <
                          groupTiers.filter(t => {
                            const idx = sortedTiers.findIndex(
                              st => st.id === t.id
                            );
                            return isTierVisible(t, idx);
                          }).length -
                            1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}

        <Separator className='mt-4' />

        <div className='grid grid-cols-2 gap-[10px]'>
          <FmCommonCard className='p-[20px]'>
            <FmCommonCardHeader icon={Tag} className='p-0 pb-2'>
              <FmCommonCardTitle className='font-medium text-sm'>{t('ticketingPanel.promoCode')}</FmCommonCardTitle>
              <FmCommonCardDescription className='text-xs'>{t('ticketingPanel.havePromoCode')}</FmCommonCardDescription>
            </FmCommonCardHeader>
            <FmCommonCardContent className='p-0'>
              <FmPromoCodeInput onPromoCodeApplied={handlePromoCodeApplied} />
            </FmCommonCardContent>
          </FmCommonCard>

          <FmCommonCard className='p-[20px]'>
            <FmCommonCardHeader icon={Gift} className='p-0 pb-2'>
              <FmCommonCardTitle className='font-medium text-sm'>{t('ticketingPanel.memberRewards')}</FmCommonCardTitle>
            </FmCommonCardHeader>
            <FmCommonCardContent className='p-0'>
              {!user ? (
                <div className='flex flex-col items-center justify-center text-center space-y-2'>
                  <div className='text-xs text-muted-foreground'>
                    {t('ticketingPanel.signInToSeeRewards')}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigate('/auth')}
                    className='text-xs h-8 border-fm-gold text-fm-gold hover:bg-fm-gold/10'
                  >
                    <LogIn className='h-3 w-3 mr-1' />
                    {t('nav.signIn')}
                  </Button>
                </div>
              ) : (
                <div className='text-xs text-foreground'>
                  {t('ticketingPanel.noRewardsAvailable')}
                </div>
              )}
            </FmCommonCardContent>
          </FmCommonCard>
        </div>

        <Separator className='mt-4' />

        <div className='space-y-3 bg-muted/20 rounded-none p-[20px]'>
          <h4 className='text-sm text-foreground mb-2'>
            {formatHeader(t('checkout.orderSummary'))}
          </h4>

          {hasSelections && (
            <>
              <FmTicketTierList selections={ticketSelections} />
              <Separator className='mt-3' />
            </>
          )}

          <div className='flex justify-between text-xs'>
            <span className='text-muted-foreground'>{t('checkout.subtotal')}</span>
            <span className='text-foreground'>${subtotal.toFixed(2)}</span>
          </div>

          {promoCode && promoDiscount > 0 && (
            <div className='flex justify-between text-xs text-green-600'>
              <span>{t('ticketingPanel.promo')} ({promoCode.code})</span>
              <span>-${promoDiscount.toFixed(2)}</span>
            </div>
          )}

          {fees.map((fee) => {
            const isSalesTax = fee.name.toLowerCase().includes('tax');
            const tooltipText =
              fee.type === 'percentage'
                ? `${fee.value}% of $${subtotalAfterPromo.toFixed(2)} = $${fee.amount.toFixed(2)}`
                : `$${fee.value.toFixed(2)} flat fee`;

            return (
              <div
                key={fee.name}
                className='flex justify-between text-xs group relative'
              >
                <span className='text-muted-foreground capitalize'>
                  {fee.name.replace(/_/g, ' ')}
                  {isSalesTax &&
                    fee.type === 'percentage' &&
                    ` (${fee.value}%)`}
                </span>
                <span className='text-foreground'>
                  ${fee.amount.toFixed(2)}
                </span>

                <div className='absolute left-0 bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-border whitespace-nowrap z-10'>
                  {tooltipText}
                </div>
              </div>
            );
          })}

          <Separator className='mt-3' />

          <div className='flex justify-between items-center pt-1'>
            <span className='font-canela text-base text-foreground'>{t('checkout.total')}</span>
            <span className='font-canela text-xl text-fm-gold'>
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <FmBigButton
          onClick={handlePurchase}
          disabled={!hasSelections}
          isLoading={isLoading}
        >
          {t('ticketingPanel.continueToCheckout')}
        </FmBigButton>
      </div>
    </div>
  );
};
