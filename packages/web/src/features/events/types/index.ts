/**
 * Centralized Event Types
 *
 * Canonical type definitions for events, tickets, and related domain models.
 * All event-related components should import from this file.
 */

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  fee_flat_cents?: number;
  fee_pct_bps?: number;
  total_tickets?: number;
  quantity_available?: number;
  available_inventory?: number;
  reserved_inventory?: number;
  sold_inventory?: number;
  quantity_sold?: number;
  tier_order?: number;
  is_active?: boolean;
  hide_until_previous_sold_out?: boolean;
  sales_start_date?: string | null;
  sales_end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UndercardArtist {
  id: string;
  event_id: string;
  artist_id: string;
  set_time?: string | null;
  set_order?: number | null;
  artist?: {
    id: string;
    name: string;
    image_url?: string | null;
  };
}

export interface TicketGroup {
  id: string;
  name: string;
  description?: string | null;
  tiers: TicketTier[];
}

export interface Venue {
  id: string;
  name: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  capacity?: number | null;
  website?: string | null;
  image_url?: string | null;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string | null;
  image_url?: string | null;
  spotify_id?: string | null;
  spotify_data?: any;
  website_url?: string | null;
  genre?: string | null;      // Artist genre
  image?: string | null;      // Alias for image_url
}

export interface Event {
  id: string;
  title: string;        // Event title (e.g., "Artist Name @ Venue Name")
  subtitle?: string | null; // Short subtitle displayed prominently
  description?: string | null; // Full description for "About This Event" section
  start_time: string;   // ISO timestamp (TIMESTAMPTZ from database)
  end_time?: string | null; // ISO timestamp (TIMESTAMPTZ from database)
  venue_id: string;
  headliner_id: string;
  image_url?: string | null;
  status?: 'draft' | 'published' | 'invisible';
  is_tba?: boolean;     // TBA (To Be Announced) placeholder event
  is_after_hours?: boolean; // Event has no end time (runs past closing)
  looking_for_undercard?: boolean; // Event is looking for local artists to open
  organization_id?: string | null;
  test_data?: boolean;
  share_count?: number; // Number of times this event has been shared
  min_interest_count_display?: number; // Minimum interest count to display publicly
  min_share_count_display?: number; // Minimum share count to display publicly
  created_at: string;
  updated_at: string;
  venue?: Venue;
  headliner?: Artist;
  undercard_artists?: UndercardArtist[];
  ticket_tiers?: TicketTier[];
}

export interface UserEventInterest {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

// Form data types (used in create/edit forms)
export interface EventFormData {
  title: string;
  subtitle?: string;
  description?: string;
  start_time: string;   // ISO timestamp
  end_time?: string;    // ISO timestamp
  venue_id: string;
  headliner_id: string;
  image_url?: string;
  status?: 'draft' | 'published';
  is_tba?: boolean;
  is_after_hours?: boolean;
  looking_for_undercard?: boolean;
}

export interface TicketTierFormData {
  name: string;
  description?: string;
  price_cents: number;
  quantity_available: number;
  sales_start_date?: string;
  sales_end_date?: string;
}

// Utility types
export type EventStatus = 'draft' | 'published' | 'invisible';

export interface EventFilters {
  status?: EventStatus;
  venue_id?: string;
  artist_id?: string;
  date_from?: string;
  date_to?: string;
}
