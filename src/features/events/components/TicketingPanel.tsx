import { ShoppingCart, Ticket } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FmTicketTierList } from './FmTicketTierList';
import { useFees } from '../hooks/useFees';

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

export const TicketingPanel = ({ tiers, onPurchase, isLoading = false }: TicketingPanelProps) => {
  const [selections, setSelections] = useState<Record<string, number>>({});
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

  const subtotal = calculateSubtotal();
  const fees = calculateFees(subtotal);
  const totalFees = getTotalFees(subtotal);
  const grandTotal = subtotal + totalFees;
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

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='flex items-center gap-2 text-foreground font-canela text-xl font-semibold mb-1'>
          <Ticket className='h-5 w-5 text-fm-gold' />
          Get Tickets
        </h3>
        <p className='text-sm text-muted-foreground'>Select your tickets and quantity</p>
      </div>
      <div className='space-y-4'>
          {sortedTiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ticket tiers available for this event
            </div>
          ) : (
            sortedTiers.map((tier, index) => {
              const isVisible = isTierVisible(tier, index);
              const soldOut = isSoldOut(tier);
              const remaining = getRemainingTickets(tier);

              if (!isVisible) return null;

              return (
                <div key={tier.id} className='space-y-3 pb-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <h3 className='font-canela font-semibold text-lg text-foreground'>{tier.name}</h3>
                        {soldOut && (
                          <span className='text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded font-medium'>
                            SOLD OUT
                          </span>
                        )}
                      </div>
                      {tier.description && (
                        <p className='text-sm text-muted-foreground'>{tier.description}</p>
                      )}
                      <div className='flex items-center text-sm'>
                        <span className='font-canela text-xl text-fm-gold font-semibold'>
                          ${Number(tier.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className='flex flex-col items-end gap-2'>
                      <label className='text-xs text-muted-foreground'>Qty:</label>
                      <Select
                        value={selections[tier.id]?.toString() || '0'}
                        onValueChange={(value) => handleQuantityChange(tier.id, parseInt(value))}
                        disabled={soldOut || remaining === 0}
                      >
                        <SelectTrigger className='w-16 bg-background border-border text-xs h-8'>
                          <SelectValue placeholder='0' />
                        </SelectTrigger>
                        <SelectContent className='bg-popover border-border z-50'>
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
                  {index < sortedTiers.filter((_, i) => isTierVisible(sortedTiers[i], i)).length - 1 && (
                    <Separator className='mt-4' />
                  )}
                </div>
              );
            })
          )}

        <Separator className='my-4' />
        
        {/* Order Summary - Always visible */}
        <div className='space-y-3 bg-muted/20 rounded-lg p-4'>
          <h4 className='text-sm font-semibold text-foreground mb-2'>Order Summary</h4>
          
          {hasSelections ? (
            <>
              <FmTicketTierList selections={ticketSelections} />
              
              <Separator className='my-3' />
              
              {/* Subtotal */}
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>Subtotal</span>
                <span className='text-foreground'>${subtotal.toFixed(2)}</span>
              </div>
              
              {/* Fees */}
              {fees.map((fee, index) => (
                <div key={index} className='flex justify-between text-xs'>
                  <span className='text-muted-foreground capitalize'>
                    {fee.name.replace(/_/g, ' ')}
                    {fee.type === 'percentage' && ` (${fee.value}%)`}
                  </span>
                  <span className='text-foreground'>${fee.amount.toFixed(2)}</span>
                </div>
              ))}
              
              <Separator className='my-3' />
              
              {/* Grand Total */}
              <div className='flex justify-between items-center pt-1'>
                <span className='font-canela text-base font-semibold text-foreground'>Total</span>
                <span className='font-canela text-xl text-fm-gold'>
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className='text-center py-3 text-muted-foreground text-xs'>
              Select tickets to see order summary
            </div>
          )}
        </div>

        {hasSelections && (
          <Button 
            className='w-full bg-fm-gold hover:bg-fm-gold/90 text-primary-foreground mt-4' 
            size='lg'
            onClick={handlePurchase}
            disabled={isLoading}
          >
            <ShoppingCart className='h-4 w-4 mr-2' />
            {isLoading ? 'Processing...' : 'Purchase Tickets'}
          </Button>
        )}
      </div>
    </div>
  );
};
