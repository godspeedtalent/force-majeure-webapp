import { ShoppingCart, Ticket } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface TicketTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  total_tickets: number;
  tickets_sold: number;
  tier_order: number;
  is_active: boolean;
  hide_until_previous_sold_out: boolean;
}

interface TicketingPanelProps {
  eventId: string;
  tiers: TicketTier[];
  onPurchase?: (selections: { tierId: string; quantity: number }[]) => void;
}

export const TicketingPanel = ({ tiers, onPurchase }: TicketingPanelProps) => {
  const [selections, setSelections] = useState<Record<string, number>>({});

  // Sort tiers by order
  const sortedTiers = [...tiers].sort((a, b) => a.tier_order - b.tier_order);

  // Determine if a tier should be visible
  const isTierVisible = (tier: TicketTier, index: number): boolean => {
    if (!tier.is_active) return false;
    
    if (tier.hide_until_previous_sold_out && index > 0) {
      const previousTier = sortedTiers[index - 1];
      return previousTier.tickets_sold >= previousTier.total_tickets;
    }
    
    return true;
  };

  // Check if tier is sold out
  const isSoldOut = (tier: TicketTier): boolean => {
    return tier.tickets_sold >= tier.total_tickets;
  };

  // Get remaining tickets
  const getRemainingTickets = (tier: TicketTier): number => {
    return Math.max(0, tier.total_tickets - tier.tickets_sold);
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

  // Calculate total
  const calculateTotal = (): number => {
    return Object.entries(selections).reduce((total, [tierId, quantity]) => {
      const tier = tiers.find(t => t.id === tierId);
      return total + (tier ? tier.price * quantity : 0);
    }, 0);
  };

  const totalAmount = calculateTotal();
  const hasSelections = Object.values(selections).some(qty => qty > 0);

  return (
    <Card className='bg-card border-border'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-foreground'>
          <Ticket className='h-5 w-5 text-fm-gold' />
          Get Tickets
        </CardTitle>
        <CardDescription>Select your tickets and quantity</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {sortedTiers.map((tier, index) => {
          const isVisible = isTierVisible(tier, index);
          const soldOut = isSoldOut(tier);
          const remaining = getRemainingTickets(tier);

          if (!isVisible) return null;

          return (
            <div key={tier.id} className='space-y-2'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-canela font-semibold text-foreground'>{tier.name}</h3>
                    {soldOut && (
                      <span className='text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded'>
                        SOLD OUT
                      </span>
                    )}
                  </div>
                  {tier.description && (
                    <p className='text-sm text-muted-foreground mt-1'>{tier.description}</p>
                  )}
                  <p className='text-sm text-muted-foreground mt-1'>
                    {remaining} of {tier.total_tickets} remaining
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='font-canela text-lg text-fm-gold'>
                    ${Number(tier.price).toFixed(2)}
                  </span>
                  <Select
                    value={selections[tier.id]?.toString() || '0'}
                    onValueChange={(value) => handleQuantityChange(tier.id, parseInt(value))}
                    disabled={soldOut || remaining === 0}
                  >
                    <SelectTrigger className='w-20 bg-background border-border'>
                      <SelectValue placeholder='0' />
                    </SelectTrigger>
                    <SelectContent className='bg-background border-border'>
                      <SelectItem value='0'>0</SelectItem>
                      {[1, 2, 3, 4].map(num => (
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
                <Separator className='my-4' />
              )}
            </div>
          );
        })}

        {hasSelections && (
          <>
            <Separator className='my-4' />
            <div className='flex items-center justify-between pt-2'>
              <span className='font-canela text-lg text-foreground'>Total</span>
              <span className='font-canela text-2xl text-fm-gold'>
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <Button 
              className='w-full bg-fm-gold hover:bg-fm-gold/90 text-primary-foreground' 
              size='lg'
              onClick={handlePurchase}
            >
              <ShoppingCart className='h-4 w-4 mr-2' />
              Purchase Tickets
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
