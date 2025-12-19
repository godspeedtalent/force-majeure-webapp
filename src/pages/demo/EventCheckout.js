import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, MapPin, Clock } from 'lucide-react';
import { TicketingPanel, useTicketTiers, useTicketFees, } from '@/components/ticketing';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonDemoToolbar } from '@/components/demo/FmCommonDemoToolbar';
import { FmEventSelectionDemoTool } from '@/components/demo/tools/FmEventSelectionDemoTool';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { supabase } from '@/shared';
import { formatTimeDisplay } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import EventCheckoutForm from './EventCheckoutForm';
import { FmInfoChip } from '@/components/common/data/FmInfoChip';
import { VenueModal } from '@/components/common/modals/VenueModal';
// Undercard artist display component
const UndercardDisplay = ({ undercardIds }) => {
    const [artists, setArtists] = useState([]);
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
    if (artists.length === 0)
        return null;
    return (_jsx("div", { className: 'text-sm text-muted-foreground', children: artists.join(' • ') }));
};
export default function EventCheckout() {
    const [selectedEventId, setSelectedEventId] = useState();
    const [eventDetails, setEventDetails] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [checkoutStep, setCheckoutStep] = useState('selection');
    const [ticketSelections, setTicketSelections] = useState([]);
    const [venueModalOpen, setVenueModalOpen] = useState(false);
    const { data: ticketTiers, isLoading: tiersLoading } = useTicketTiers(selectedEventId);
    const { startCheckout } = useCheckoutTimer();
    const queryClient = useQueryClient();
    const { getTotalFees } = useTicketFees();
    const handleEventUpdated = () => {
        // Trigger a refresh of the event details
        setRefreshKey(prev => prev + 1);
        // Also invalidate the ticket tiers query to refetch them
        if (selectedEventId) {
            queryClient.invalidateQueries({
                queryKey: ['ticket-tiers', selectedEventId],
            });
        }
    };
    // Create demo tool instance
    const eventSelectionTool = FmEventSelectionDemoTool({
        selectedEventId,
        onEventChange: setSelectedEventId,
        onEventUpdated: handleEventUpdated,
    });
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
    const handleContinueToCheckout = (selections) => {
        if (!selectedEventId)
            return;
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
        const subtotal = tickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
        const fees = getTotalFees(subtotal);
        const total = subtotal + fees;
        return { subtotal, fees, total, tickets };
    };
    return (_jsxs(DemoLayout, { title: 'Event Checkout Demo', description: 'Test the complete ticket purchasing flow', icon: ShoppingCart, condensed: true, children: [_jsx(FmCommonDemoToolbar, { tools: [eventSelectionTool] }), !selectedEventId ? (_jsx("div", { className: 'text-center py-12 text-muted-foreground', children: "Select an event from Demo Tools to begin" })) : checkoutStep === 'checkout' ? (_jsx(EventCheckoutForm, { eventId: selectedEventId, eventName: eventDetails?.title || 'Event', eventDate: eventDetails?.date || '', selections: ticketSelections, orderSummary: getOrderSummary(), onBack: handleBackToSelection })) : (_jsxs("div", { className: 'bg-card border-border rounded-lg overflow-hidden', children: [eventDetails && eventDetails.hero_image && (_jsx("div", { className: 'w-full h-64 overflow-hidden', children: _jsx("img", { src: eventDetails.hero_image, alt: eventDetails.title, className: 'w-full h-full object-cover' }) })), eventDetails && (_jsx("div", { className: 'p-6', children: _jsxs("div", { className: 'flex gap-6', children: [eventDetails.headliner?.image_url && (_jsx("img", { src: eventDetails.headliner.image_url, alt: eventDetails.title, className: 'w-32 h-32 rounded-lg object-cover' })), _jsxs("div", { className: 'flex-1 space-y-2', children: [_jsx("h2", { className: 'text-2xl font-canela text-foreground', children: eventDetails.title }), eventDetails.undercard_ids &&
                                            eventDetails.undercard_ids.length > 0 && (_jsx(UndercardDisplay, { undercardIds: eventDetails.undercard_ids })), _jsxs("div", { className: 'flex flex-wrap gap-3', children: [_jsx(FmInfoChip, { icon: Calendar, label: new Date(eventDetails.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    }) }), eventDetails.time && (_jsx(FmInfoChip, { icon: Clock, label: formatTimeDisplay(eventDetails.time) })), eventDetails.venue && (_jsx(FmInfoChip, { icon: MapPin, label: `${eventDetails.venue.name}${eventDetails.venue.city ? ` • ${eventDetails.venue.city}` : ''}`, onClick: () => setVenueModalOpen(true) }))] }), eventDetails.description && (_jsx("p", { className: 'text-muted-foreground text-xs', children: eventDetails.description }))] })] }) })), eventDetails && _jsx("div", { className: 'border-t border-border' }), _jsx("div", { className: 'p-6', children: _jsx(TicketingPanel, { tiers: ticketTiers?.map(tier => ({
                                id: tier.id,
                                name: tier.name,
                                description: tier.description ?? undefined,
                                price: tier.price_cents / 100,
                                total_tickets: tier.total_tickets ?? 0,
                                available_inventory: tier.available_inventory ?? 0,
                                tier_order: tier.tier_order ?? 0,
                                is_active: tier.is_active ?? true,
                                hide_until_previous_sold_out: tier.hide_until_previous_sold_out ?? false,
                            })) || [], onPurchase: handleContinueToCheckout, isLoading: tiersLoading, initialSelections: ticketSelections.reduce((acc, item) => {
                                acc[item.tierId] = item.quantity;
                                return acc;
                            }, {}) }) })] })), _jsx(VenueModal, { venueId: eventDetails?.venue_id || null, open: venueModalOpen, onOpenChange: setVenueModalOpen })] }));
}
