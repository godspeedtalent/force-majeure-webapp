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
  /** Flat fee in cents for this tier */
  fee_flat_cents?: number;
  /** Percentage fee in basis points (100 = 1%) */
  fee_pct_bps?: number;
  /** When true, inherits fees from the parent group */
  inherit_group_fees?: boolean;
}

export interface TicketGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  tiers: TicketTier[];
  /** Flat fee in cents for this group */
  fee_flat_cents?: number;
  /** Percentage fee in basis points (100 = 1%) */
  fee_pct_bps?: number;
  /** When true, inherits fees from the event */
  inherit_event_fees?: boolean;
}

/** Event-level fee settings */
export interface EventFeeSettings {
  /** When true, uses global ticketing_fees table */
  use_default_fees: boolean;
  /** Custom flat fee in cents */
  fee_flat_cents: number;
  /** Custom percentage fee in basis points */
  fee_pct_bps: number;
}

export interface TicketGroupManagerProps {
  groups: TicketGroup[];
  onChange: (groups: TicketGroup[]) => void;
  /** Event-level fees to pass down to groups/tiers for inheritance display */
  eventFees?: { flatCents: number; pctBps: number };
}
