export interface TicketTier {
  id?: string;
  name: string;
  description: string;
  price_cents: number;
  total_tickets: number;
  tier_order: number;
  hide_until_previous_sold_out: boolean;
  group_id?: string;
  /** Whether this tier has any orders associated with it */
  has_orders?: boolean;
  /** Number of tickets sold for this tier */
  sold_inventory?: number;
  /** Number of tickets available for this tier */
  available_inventory?: number;
}

export interface TicketGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  tiers: TicketTier[];
}

export interface TicketGroupManagerProps {
  groups: TicketGroup[];
  onChange: (groups: TicketGroup[]) => void;
}
