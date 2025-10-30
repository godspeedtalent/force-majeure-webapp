import { ShoppingCart, Ticket, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Label } from '@/components/ui/shadcn/label';
import { Separator } from '@/components/ui/shadcn/separator';
import { FmTicketTierList } from './FmTicketTierList';
import { FmPromoCodeInput } from '@/components/ui/misc/FmPromoCodeInput';
import { useFees } from '../hooks/useFees';
import { cn } from '@/shared/utils/utils';

interface TicketTier {
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
  eventId: string;
  tiers: TicketTier[];
  onPurchase?: (selections: { tierId: string; quantity: number }[]) => void;
  isLoading?: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
}

export const TicketingPanel = ({ tiers, onPurchase, isLoading = false }: TicketingPanelProps) => {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'General Admission': true,
    'VIP': true,
  });
  const { calculateFees, getTotalFees } = useFees();

  // Sort tiers by order
  const sortedTiers = [...tiers].sort((a, b) => a.tier_order - b.tier_order);

  // Determine if a tier should be visible
  const isTierVisible = (tier: TicketTier, index: number): boolean => {
    if (!tier.is_active) return false;
    
    if (tier.hide_until_previous_sold_out && index > 0) {
      const previousTier = sortedTiers[index - 1];
      return previousTier.available_inventory === 0;
    }
    
    return true;
  };

  // Check if tier is sold out
  const isSoldOut = (tier: TicketTier): boolean => {
    return tier.available_inventory === 0;
  };

  // Get remaining tickets
  const getRemainingTickets = (tier: TicketTier): number => {
    return Math.max(0, tier.available_inventory);
  };

  // Handle quantity selection
  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelections(prev => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  // Handle purchase
  const handlePurchase = () => {
    const purchaseSelections = Object.entries(selections)
      .filter(([_, quantity]) => quantity > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity }));
    
    if (purchaseSelections.length > 0 && onPurchase) {
      onPurchase(purchaseSelections);
    }
  };

  // Calculate totals
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
      // Ensure discount doesn't exceed subtotal
      return Math.min(discount, subtotal);
    } else {
      // Flat discount in dollars - cannot exceed subtotal
      return Math.min(Number(promoCode.discount_value), subtotal);
    }
  };

  // Calculate final price per ticket (including fees)
  const calculateFinalTicketPrice = (basePrice: number): number => {
    const baseFees = calculateFees(basePrice);
    const totalFeesForTicket = baseFees.reduce((sum, fee) => sum + fee.amount, 0);
    return basePrice + totalFeesForTicket;
  };

  // Group tiers by category
  const groupTiers = () => {
    const groups: Record<string, TicketTier[]> = {
      'General Admission': [],
      'VIP': [],
    };

    sortedTiers.forEach((tier) => {
      // Determine group based on tier name
      if (tier.name.toLowerCase().includes('table') || tier.name.toLowerCase().includes('vip')) {
        groups['VIP'].push(tier);
      } else {
        groups['General Admission'].push(tier);
      }
    });

    // Remove empty groups (including groups where all tiers are hidden)
    Object.keys(groups).forEach(key => {
      const visibleTiers = groups[key].filter((tier) => {
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

  // Get price breakdown for tooltip
  const getPriceBreakdown = (basePrice: number) => {
    const baseFees = calculateFees(basePrice);
    const breakdown = [
      { label: 'Base Price', amount: basePrice },
      ...baseFees.map(fee => ({
        label: fee.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount: fee.amount,
      })),
    ];
    const total = basePrice + baseFees.reduce((sum, fee) => sum + fee.amount, 0);
    return { breakdown, total };
  };

  // Toggle group expansion
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

  // Get selections for breakdown
  const ticketSelections = Object.entries(selections)
    .filter(([_, quantity]) => quantity > 0)
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
        <h3 className='flex items-center gap-2 text-foreground font-canela text-xl mb-1'>
          <Ticket className='h-5 w-5 text-fm-gold' />
          Get Tickets
        </h3>
        <p className='text-sm text-muted-foreground'>Select your tickets and quantity</p>
        <div className='mt-2 px-3 py-2 bg-fm-gold/10 border border-fm-gold/30 rounded-md'>
          <p className='text-xs text-fm-gold'>
            All ticket prices shown include service fees and taxes
          </p>
        </div>
      </div>
      <div className='space-y-4'>
          {sortedTiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ticket tiers available for this event
            </div>
          ) : (
            Object.entries(tiersGrouped).map(([groupName, groupTiers]) => (
              <div key={groupName} className='space-y-2'>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupName)}
                  className='w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 rounded-md transition-colors'
                >
                  <span className='text-sm font-medium text-foreground'>{groupName}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      expandedGroups[groupName] ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>

                {/* Group Tiers */}
                {expandedGroups[groupName] && (
                  <div className='space-y-0 border border-border rounded-md overflow-hidden'>
                    {groupTiers.map((tier, tierIndex) => {
                      const globalIndex = sortedTiers.findIndex(t => t.id === tier.id);
                      const isVisible = isTierVisible(tier, globalIndex);
                      const soldOut = isSoldOut(tier);
                      const remaining = getRemainingTickets(tier);

                      if (!isVisible) return null;

                      return (
                        <div key={tier.id}>
                          <div className={cn(
                            'group transition-colors hover:bg-muted/40',
                            tierIndex % 2 === 1 && 'bg-white/5'
                          )}>
                            <div className='flex items-start justify-between gap-4 px-3 py-2'>
                              <div className='flex-1 space-y-1'>
                                <h3 className='font-medium text-xs text-foreground'>{tier.name}</h3>
                                {tier.description && (
                                  <p className='text-xs italic text-muted-foreground'>{tier.description}</p>
                                )}
                                {soldOut && (
                                  <span className='text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium inline-block'>
                                    SOLD OUT
                                  </span>
                                )}
                              </div>
                              <div className='flex items-center gap-3'>
                                <div className='relative group/price'>
                                  <span className='text-xs text-fm-gold cursor-help'>
                                    ${calculateFinalTicketPrice(tier.price).toFixed(2)}
                                  </span>
                                  {/* Price Breakdown Tooltip */}
                                  <div className='absolute right-0 bottom-full mb-2 hidden group-hover/price:block bg-popover text-popover-foreground px-3 py-2 rounded-md border border-border shadow-lg whitespace-nowrap z-20 min-w-[200px]'>
                                    <div className='text-xs font-medium mb-2 text-foreground'>Price Breakdown</div>
                                    <div className='space-y-1'>
                                      {getPriceBreakdown(tier.price).breakdown.map((item, idx) => (
                                        <div key={idx} className='flex justify-between text-xs'>
                                          <span className='text-muted-foreground'>{item.label}:</span>
                                          <span className='text-foreground'>${item.amount.toFixed(2)}</span>
                                        </div>
                                      ))}
                                      <div className='border-t border-border pt-1 mt-1'>
                                        <div className='flex justify-between text-xs font-medium'>
                                          <span className='text-foreground'>Total:</span>
                                          <span className='text-fm-gold'>${getPriceBreakdown(tier.price).total.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Label htmlFor={`qty-${tier.id}`} className='text-xs text-muted-foreground'>
                                    Qty:
                                  </Label>
                                  <Select
                                    value={selections[tier.id]?.toString() || '0'}
                                    onValueChange={(value) => handleQuantityChange(tier.id, parseInt(value))}
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
                          {tierIndex < groupTiers.filter((t) => {
                            const idx = sortedTiers.findIndex(st => st.id === t.id);
                            return isTierVisible(t, idx);
                          }).length - 1 && (
                            <Separator />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}

        <Separator className='mt-4' />

        {/* Promo Code Input */}
        <div className='px-3 py-3 bg-muted/10 rounded-md'>
          <div className='text-xs text-muted-foreground mb-2'>Have a promo code?</div>
          <FmPromoCodeInput onPromoCodeApplied={handlePromoCodeApplied} />
        </div>
        
        <Separator className='mt-4' />
        
        {/* Order Summary - Always visible */}
        <div className='space-y-3 bg-muted/20 rounded-lg p-4'>
          <h4 className='text-sm text-foreground mb-2'>Order Summary</h4>

          {hasSelections && (
            <>
              <FmTicketTierList selections={ticketSelections} />
              <Separator className='mt-3' />
            </>
          )}

          {/* Subtotal - Always show */}
          <div className='flex justify-between text-xs'>
            <span className='text-muted-foreground'>Subtotal</span>
            <span className='text-foreground'>${subtotal.toFixed(2)}</span>
          </div>

          {/* Promo Discount */}
          {promoCode && promoDiscount > 0 && (
            <div className='flex justify-between text-xs text-green-600'>
              <span>Promo ({promoCode.code})</span>
              <span>-${promoDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Fees - Always show */}
          {fees.map((fee, index) => {
            const isSalesTax = fee.name.toLowerCase().includes('tax');
            const tooltipText = fee.type === 'percentage'
              ? `${fee.value}% of $${subtotalAfterPromo.toFixed(2)} = $${fee.amount.toFixed(2)}`
              : `$${fee.value.toFixed(2)} flat fee`;

            return (
              <div key={index} className='flex justify-between text-xs group relative'>
                <span className='text-muted-foreground capitalize'>
                  {fee.name.replace(/_/g, ' ')}
                  {isSalesTax && fee.type === 'percentage' && ` (${fee.value}%)`}
                </span>
                <span className='text-foreground'>${fee.amount.toFixed(2)}</span>

                {/* Tooltip */}
                <div className='absolute left-0 bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-border whitespace-nowrap z-10'>
                  {tooltipText}
                </div>
              </div>
            );
          })}

          <Separator className='mt-3' />

          {/* Grand Total - Always show */}
          <div className='flex justify-between items-center pt-1'>
            <span className='font-canela text-base text-foreground'>Total</span>
            <span className='font-canela text-xl text-fm-gold'>
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <Button 
          className='w-full bg-fm-gold hover:bg-fm-gold/90 text-black font-medium transition-all mt-4' 
          size='lg'
          onClick={handlePurchase}
          disabled={!hasSelections || isLoading}
        >
          <ShoppingCart className='h-4 w-4 mr-2' />
          {isLoading ? 'Processing...' : 'Continue to Checkout'}
        </Button>
      </div>
    </div>
  );
};
