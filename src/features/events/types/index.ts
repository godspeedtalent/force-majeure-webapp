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
  description?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  capacity?: number | null;
  website?: string | null;
  /** @deprecated Use gallery system instead - venues have galleries via media_galleries.venue_id */
  image_url?: string | null;
  logo_url?: string | null;
  // Social media fields
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string | null;
  /** @deprecated Use gallery_id and fetch cover image from gallery instead */
  image_url?: string | null;
  gallery_id?: string | null; // FK to media_galleries - use this for the artist's featured image
  spotify_id?: string | null;
  spotify_data?: any;
  website_url?: string | null;
  website?: string | null;    // Database column name
  genre?: string | null;      // Artist genre
  /** @deprecated Use gallery_id instead */
  image?: string | null;      // Legacy alias for image_url
  // Social media fields
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  soundcloud_id?: string | null;
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
  no_headliner?: boolean; // When true, all artists are undercard with no featured headliner
  image_url?: string | null;
  status?: 'draft' | 'published' | 'invisible' | 'test';
  is_tba?: boolean;     // TBA (To Be Announced) placeholder event
  is_after_hours?: boolean; // Event has no end time (runs past closing)
  looking_for_undercard?: boolean; // Event is looking for local artists to open
  organization_id?: string | null;
  test_data?: boolean;
  share_count?: number; // Number of times this event has been shared
  min_interest_count_display?: number; // Minimum interest count to display publicly
  min_share_count_display?: number; // Minimum share count to display publicly
  display_subtitle?: boolean; // Whether to display subtitle on event cards
  show_partners?: boolean; // Whether to display partner organizations on the event page
  show_guest_list?: boolean; // Whether to display guest list section on the event page
  gallery_id?: string | null; // FK to media_galleries for event images
  hero_image?: string | null; // Hero image URL
  hero_image_focal_x?: number | null; // Hero image focal point X (0-100)
  hero_image_focal_y?: number | null; // Hero image focal point Y (0-100)
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
  status?: 'draft' | 'published' | 'test';
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
export type EventStatus = 'draft' | 'published' | 'invisible' | 'test';

export interface EventFilters {
  status?: EventStatus;
  venue_id?: string;
  artist_id?: string;
  date_from?: string;
  date_to?: string;
}
