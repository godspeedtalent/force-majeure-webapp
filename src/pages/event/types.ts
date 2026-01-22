export interface ArtistSummary {
  id?: string;
  name: string;
  genre: string;
  image?: string | null;
  setTime?: string | null;
  setOrder?: number | null;
}

export interface VenueDetails {
  id?: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  image?: string | null;
  logo?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
}

export type EventStatus = 'draft' | 'published' | 'invisible';

export interface EventDetailsRecord {
  id: string;
  title: string | null;
  subtitle?: string | null;
  headliner: ArtistSummary;
  undercard: ArtistSummary[];
  date: string;
  time: string;
  endTime: string | null;
  isAfterHours: boolean;
  lookingForUndercard: boolean;
  venue: string;
  venueDetails: VenueDetails | null;
  heroImage: string;
  description: string | null;
  status: EventStatus;
  /** Whether this event uses RSVP instead of ticketing */
  isFreeEvent: boolean;
  /** Whether this event is RSVP-only (no paid tickets) */
  isRsvpOnlyEvent: boolean;
  /** Optional subtitle/footnote displayed below the RSVP button */
  rsvpButtonSubtitle?: string | null;
  /** Whether this event has no headliner (TBA artist should not be shown) */
  noHeadliner: boolean;
  /** Whether to display the hero image at full height on mobile */
  mobileFullHeroHeight: boolean;
}
