import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, MapPin, Clock } from 'lucide-react';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { EventCheckoutDemoTools } from '@/components/demo/EventCheckoutDemoTools';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';
import { useQueryClient } from '@tanstack/react-query';
import EventCheckoutForm from './EventCheckoutForm';
import { useFees } from '@/features/events/hooks/useFees';

// Undercard artist display component
const UndercardDisplay = ({ undercardIds }: { undercardIds: string[] }) => {
  const [artists, setArtists] = useState<string[]>([]);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data } = await supabase
        .from('artists')
        .select('name')
        .in('id', undercardIds);
      
      if (data) {
        setArtists(data.map(a => a.name));
      }
    };

    if (undercardIds.length > 0) {
      fetchArtists();
    }
  }, [undercardIds]);

  if (artists.length === 0) return null;

  return (
    <div className="text-sm text-muted-foreground">
      {artists.join(' • ')}
    </div>
  );
};

export default function EventCheckout() {
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'checkout'>('selection');
  const [ticketSelections, setTicketSelections] = useState<{ tierId: string; quantity: number }[]>([]);
  const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(selectedEventId);
  const { startCheckout } = useCheckoutTimer();
  const queryClient = useQueryClient();
  const { getTotalFees } = useFees();

  const handleEventUpdated = () => {
    // Trigger a refresh of the event details
    setRefreshKey(prev => prev + 1);
    // Also invalidate the ticket tiers query to refetch them
    if (selectedEventId) {
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', selectedEventId] });
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      // Fetch event details
      const fetchEventDetails = async () => {
        const { data } = await supabase
          .from('events')
          .select(`
            *,
            headliner:headliner_id (
              name,
              image_url
            ),
            venue:venue_id (
              name,
              city
            )
          `)
          .eq('id', selectedEventId)
          .single();
        
        if (data) {
          setEventDetails(data);
        }
      };

      fetchEventDetails();

      // Start the checkout timer when an event is selected
      startCheckout(window.location.pathname);
    }
  }, [selectedEventId, startCheckout, refreshKey]);

  const handleContinueToCheckout = (selections: { tierId: string; quantity: number }[]) => {
    if (!selectedEventId) return;
    setTicketSelections(selections);
    setCheckoutStep('checkout');
  };

  const handleBackToSelection = () => {
    setCheckoutStep('selection');
    setTicketSelections([]);
  };

  // Calculate order summary
  const getOrderSummary = () => {
    if (!ticketTiers || ticketSelections.length === 0) {
      return { subtotal: 0, fees: 0, total: 0, tickets: [] };
    }

    const tickets = ticketSelections.map(sel => {
      const tier = ticketTiers.find(t => t.id === sel.tierId);
      return {
        name: tier?.name || '',
        quantity: sel.quantity,
        price: tier?.price_cents ? tier.price_cents / 100 : 0,
      };
    });

    const subtotal = tickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    const fees = getTotalFees(subtotal);
    const total = subtotal + fees;

    return { subtotal, fees, total, tickets };
  };

  return (
    <DemoLayout
      title="Event Checkout Demo"
      description="Test the complete ticket purchasing flow"
      icon={ShoppingCart}
      condensed
      demoTools={
        <EventCheckoutDemoTools
          selectedEventId={selectedEventId}
          onEventChange={setSelectedEventId}
          onEventUpdated={handleEventUpdated}
        />
      }
    >
          {!selectedEventId ? (
            <div className="text-center py-12 text-muted-foreground">
              Select an event from Demo Tools to begin
            </div>
          ) : checkoutStep === 'checkout' ? (
            <EventCheckoutForm
              eventId={selectedEventId}
              eventName={eventDetails?.title || 'Event'}
              eventDate={eventDetails?.date || ''}
              selections={ticketSelections}
              orderSummary={getOrderSummary()}
              onBack={handleBackToSelection}
            />
          ) : (
            <div className="bg-card border-border rounded-lg overflow-hidden">
              {/* Event Hero Image */}
              {eventDetails && eventDetails.hero_image && (
                <div className="w-full h-64 overflow-hidden">
                  <img
                    src={eventDetails.hero_image}
                    alt={eventDetails.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Event Information Section */}
              {eventDetails && (
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Event Image */}
                    {eventDetails.headliner?.image_url && (
                      <img
                        src={eventDetails.headliner.image_url}
                        alt={eventDetails.title}
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    )}

                    {/* Event Details */}
                    <div className="flex-1 space-y-2">
                      <h2 className="text-2xl font-canela text-foreground">
                        {eventDetails.title}
                      </h2>

                      {/* Undercard Artists */}
                      {eventDetails.undercard_ids && eventDetails.undercard_ids.length > 0 && (
                        <UndercardDisplay undercardIds={eventDetails.undercard_ids} />
                      )}

                      <div className="flex flex-wrap gap-3 text-muted-foreground text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-fm-gold" />
                          <span>{new Date(eventDetails.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </div>

                        {eventDetails.time && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-fm-gold" />
                            <span>{formatTimeDisplay(eventDetails.time)}</span>
                          </div>
                        )}

                        {eventDetails.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-fm-gold" />
                            <span>
                              {eventDetails.venue.name}
                              {eventDetails.venue.city && ` • ${eventDetails.venue.city}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {eventDetails.description && (
                        <p className="text-muted-foreground text-xs">
                          {eventDetails.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              {eventDetails && (
                <div className="border-t border-border" />
              )}

              {/* Ticketing Section */}
              <div className="p-6">
                <TicketingPanel
                  eventId={selectedEventId}
                  tiers={ticketTiers?.map(tier => ({
                    ...tier,
                    price: tier.price_cents / 100,
                  })) || []}
                  onPurchase={handleContinueToCheckout}
                  isLoading={tiersLoading}
                />
              </div>
            </div>
          )}
    </DemoLayout>
  );
}
