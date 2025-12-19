export const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
};
export const getTotalTicketsInGroup = (group) => {
    return group.tiers.reduce((sum, tier) => sum + tier.total_tickets, 0);
};
export const getTotalRevenueInGroup = (group) => {
    return group.tiers.reduce((sum, tier) => sum + tier.total_tickets * tier.price_cents, 0);
};
export const calculateTotalTickets = (groups) => {
    return groups.reduce((sum, group) => sum +
        group.tiers.reduce((tierSum, tier) => tierSum + tier.total_tickets, 0), 0);
};
export const calculateTotalRevenue = (groups) => {
    return groups.reduce((sum, group) => sum +
        group.tiers.reduce((tierSum, tier) => tierSum + tier.price_cents * tier.total_tickets, 0), 0);
};
export const calculateTotalGroups = (groups) => {
    return groups.length;
};
export const calculateTotalTiers = (groups) => {
    return groups.reduce((sum, group) => sum + group.tiers.length, 0);
};
