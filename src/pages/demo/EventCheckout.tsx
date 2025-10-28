import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, MapPin, Clock } from 'lucide-react';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import { useCheckout } from '@/features/events/hooks/useCheckout';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { EventCheckoutDemoTools } from '@/components/demo/EventCheckoutDemoTools';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';

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
  const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(selectedEventId);
  const { initiateCheckout, isLoading: checkoutLoading } = useCheckout();
  const { startCheckout } = useCheckoutTimer();

  const handleEventUpdated = () => {
    // Trigger a refresh of the event details
    setRefreshKey(prev => prev + 1);
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
      ) : (
        <div className="bg-card border-border rounded-lg overflow-hidden">
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
                <div className="flex-1 space-y-3">
                  <h2 className="text-3xl font-canela text-foreground">
                    {eventDetails.title}
                  </h2>
                  
                  {/* Undercard Artists */}
                  {eventDetails.undercard_ids && eventDetails.undercard_ids.length > 0 && (
                    <UndercardDisplay undercardIds={eventDetails.undercard_ids} />
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-fm-gold" />
                      <span>{new Date(eventDetails.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    
                    {eventDetails.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-fm-gold" />
                        <span>{formatTimeDisplay(eventDetails.time)}</span>
                      </div>
                    )}
                    
                    {eventDetails.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-fm-gold" />
                        <span>
                          {eventDetails.venue.name}
                          {eventDetails.venue.city && ` • ${eventDetails.venue.city}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {eventDetails.description && (
                    <p className="text-muted-foreground text-sm">
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
              onPurchase={handlePurchase}
              isLoading={tiersLoading || checkoutLoading}
            />
          </div>
        </div>
      )}
    </DemoLayout>
  );
}
