/**
 * Centralized Ticketing Types
 *
 * Canonical type definitions for ticket tiers, selections, and checkout.
 * All ticketing-related components should import from this file.
 *
 * Note: The base TicketTier type is defined in @/features/events/types
 * This file provides additional ticketing-specific types.
 */
/**
 * Calculate total fees for a given price
 */
export function calculateFees(priceCents, fees) {
    const flatFee = fees.flatFeeCents;
    const percentageFee = Math.round((priceCents * fees.percentageFeeBps) / 10000);
    return flatFee + percentageFee;
}
/**
 * Calculate order summary from selections
 */
export function calculateOrderSummary(selections) {
    const items = selections
        .filter(s => s.quantity > 0)
        .map(s => ({
        tierName: s.tierName,
        quantity: s.quantity,
        subtotal: s.pricePerTicket * s.quantity,
        fees: s.feesPerTicket * s.quantity,
        total: (s.pricePerTicket + s.feesPerTicket) * s.quantity,
    }));
    return {
        items,
        subtotalCents: items.reduce((sum, item) => sum + item.subtotal, 0),
        feesCents: items.reduce((sum, item) => sum + item.fees, 0),
        totalCents: items.reduce((sum, item) => sum + item.total, 0),
        ticketCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
}
/**
 * Get the status of a ticket tier
 */
export function getTicketTierStatus(tier, now = new Date()) {
    if (tier.sales_start_date && new Date(tier.sales_start_date) > now) {
        return 'not_yet_available';
    }
    if (tier.sales_end_date && new Date(tier.sales_end_date) < now) {
        return 'sales_ended';
    }
    if (tier.quantity_available !== undefined && tier.quantity_available <= 0) {
        return 'sold_out';
    }
    return 'available';
}
