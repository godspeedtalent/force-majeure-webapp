import type { TicketGroup } from './types';

export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const getTotalTicketsInGroup = (group: TicketGroup): number => {
  return group.tiers.reduce((sum, tier) => sum + tier.total_tickets, 0);
};

export const getTotalRevenueInGroup = (group: TicketGroup): number => {
  return group.tiers.reduce(
    (sum, tier) => sum + tier.total_tickets * tier.price_cents,
    0
  );
};

export const calculateTotalTickets = (groups: TicketGroup[]): number => {
  return groups.reduce(
    (sum, group) =>
      sum +
      group.tiers.reduce((tierSum, tier) => tierSum + tier.total_tickets, 0),
    0
  );
};

export const calculateTotalRevenue = (groups: TicketGroup[]): number => {
  return groups.reduce(
    (sum, group) =>
      sum +
      group.tiers.reduce(
        (tierSum, tier) => tierSum + tier.price_cents * tier.total_tickets,
        0
      ),
    0
  );
};

export const calculateTotalGroups = (groups: TicketGroup[]): number => {
  return groups.length;
};

export const calculateTotalTiers = (groups: TicketGroup[]): number => {
  return groups.reduce((sum, group) => sum + group.tiers.length, 0);
};
