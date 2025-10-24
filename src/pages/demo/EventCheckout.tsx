import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import { useCheckout } from '@/features/events/hooks/useCheckout';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { EventCheckoutDemoTools } from '@/components/demo/EventCheckoutDemoTools';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';

export default function EventCheckout() {
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(selectedEventId);
  const { initiateCheckout, isLoading: checkoutLoading } = useCheckout();
  const { startCheckout } = useCheckoutTimer();

  useEffect(() => {
    if (selectedEventId) {
      // Start the checkout timer when an event is selected
      // Redirect to current page to reset selection
      startCheckout(window.location.pathname);
    }
  }, [selectedEventId, startCheckout]);

  const handlePurchase = (selections: { tierId: string; quantity: number }[]) => {
    if (!selectedEventId) return;
    
    const tickets = selections.map(s => ({
      tier_id: s.tierId,
      quantity: s.quantity,
    }));

    initiateCheckout(selectedEventId, tickets);
  };

  return (
    <DemoLayout
      title="Event Checkout Demo"
      description="Test the complete ticket purchasing flow"
      icon={ShoppingCart}
      demoTools={
        <EventCheckoutDemoTools
          selectedEventId={selectedEventId}
          onEventChange={setSelectedEventId}
        />
      }
    >
      {!selectedEventId ? (
        <div className="text-center py-12 text-muted-foreground">
          Select an event from Demo Tools to begin
        </div>
      ) : (
        <TicketingPanel
          eventId={selectedEventId}
          tiers={ticketTiers?.map(tier => ({
            ...tier,
            price: tier.price_cents / 100,
          })) || []}
          onPurchase={handlePurchase}
          isLoading={tiersLoading || checkoutLoading}
        />
      )}
    </DemoLayout>
  );
}
