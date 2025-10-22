import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import { useCheckout } from '@/features/events/hooks/useCheckout';
import { LoadingState } from '@/components/common/LoadingState';
import { format } from 'date-fns';

export default function EventCheckout() {
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(selectedEventId);
  const { initiateCheckout } = useCheckout();

  const handlePurchase = (selections: { tierId: string; quantity: number }[]) => {
    if (!selectedEventId) return;
    
    const tickets = selections.map(s => ({
      tier_id: s.tierId,
      quantity: s.quantity,
    }));

    initiateCheckout(selectedEventId, tickets);
  };

  if (eventsLoading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/demo" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Demos
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Event Checkout Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Test the complete ticket purchasing flow
          </p>
          <Badge variant="outline" className="mt-2">
            Development Only
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Event Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Event</CardTitle>
              <CardDescription>
                Choose an event to test ticket purchasing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full p-4 border rounded-lg text-left transition-all hover:border-primary ${
                      selectedEventId === event.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), 'MMM d, yyyy')} at {event.time}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No events available. Create events in the admin panel first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ticket Selection */}
          {selectedEventId && (
            <>
              {tiersLoading ? (
                <Card>
                  <CardContent className="py-8">
                    <LoadingState />
                  </CardContent>
                </Card>
              ) : ticketTiers && ticketTiers.length > 0 ? (
                <TicketingPanel
                  eventId={selectedEventId}
                  tiers={ticketTiers.map(tier => ({
                    id: tier.id,
                    name: tier.name,
                    description: tier.description,
                    price: tier.price_cents / 100,
                    total_tickets: tier.total_tickets,
                    tickets_sold: tier.sold_inventory,
                    tier_order: tier.tier_order,
                    is_active: tier.is_active,
                    hide_until_previous_sold_out: tier.hide_until_previous_sold_out,
                  }))}
                  onPurchase={handlePurchase}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Tickets Available</CardTitle>
                    <CardDescription>
                      This event doesn't have any ticket tiers configured yet
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </>
          )}

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Technical details for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edge Function:</span>
                  <span>create-checkout-session</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Webhook Handler:</span>
                  <span>handle-stripe-webhook</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hold Duration:</span>
                  <span>10 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
