/**
 * Field Display Configuration for Activity Logs
 *
 * Defines which fields to display for each resource type and how to format them.
 * Used by ActivityLogDetail to render meaningful change information.
 */

import {
  formatDateTime,
  formatDate,
  formatBoolean,
  formatArray,
  formatNumber,
  formatCurrency,
  formatDuration,
  formatUrl,
} from '../utils/fieldFormatters';

/**
 * Configuration for a single field
 */
export interface FieldConfig {
  /** Database field key */
  key: string;
  /** Human-readable label */
  label: string;
  /** Optional formatter function */
  formatter?: (value: unknown) => string;
  /** Max length before truncation */
  truncate?: number;
  /** Hide this field from display */
  hidden?: boolean;
  /** Display priority (lower = higher priority, shown first) */
  priority?: number;
}

/**
 * Resource types that have field configurations
 */
export type ResourceType =
  | 'events'
  | 'artists'
  | 'venues'
  | 'recordings'
  | 'ticket_tiers'
  | 'profiles'
  | 'user_roles';

/**
 * Field configurations by resource type
 * Priority determines display order (1 = most important)
 */
export const FIELD_CONFIG: Record<ResourceType, FieldConfig[]> = {
  events: [
    { key: 'title', label: 'Title', priority: 1 },
    { key: 'start_date', label: 'Start Date', formatter: formatDateTime, priority: 2 },
    { key: 'end_date', label: 'End Date', formatter: formatDateTime, priority: 3 },
    { key: 'status', label: 'Status', priority: 4 },
    { key: 'is_published', label: 'Published', formatter: formatBoolean, priority: 5 },
    { key: 'description', label: 'Description', truncate: 100, priority: 10 },
    { key: 'venue_name', label: 'Venue', priority: 6 },
    { key: 'capacity', label: 'Capacity', formatter: formatNumber, priority: 7 },
    { key: 'ticket_sales_enabled', label: 'Ticket Sales', formatter: formatBoolean, priority: 8 },
    // Hidden internal fields
    { key: 'venue_id', label: 'Venue ID', hidden: true },
    { key: 'organization_id', label: 'Organization ID', hidden: true },
  ],

  artists: [
    { key: 'stage_name', label: 'Stage Name', priority: 1 },
    { key: 'genres', label: 'Genres', formatter: formatArray, priority: 2 },
    { key: 'city_name', label: 'City', priority: 3 },
    { key: 'country', label: 'Country', priority: 4 },
    { key: 'bio', label: 'Bio', truncate: 100, priority: 10 },
    { key: 'spotify_url', label: 'Spotify', formatter: formatUrl, priority: 5 },
    { key: 'soundcloud_url', label: 'SoundCloud', formatter: formatUrl, priority: 6 },
    { key: 'instagram_url', label: 'Instagram', formatter: formatUrl, priority: 7 },
    { key: 'website_url', label: 'Website', formatter: formatUrl, priority: 8 },
    { key: 'is_verified', label: 'Verified', formatter: formatBoolean, priority: 9 },
  ],

  venues: [
    { key: 'name', label: 'Name', priority: 1 },
    { key: 'city', label: 'City', priority: 2 },
    { key: 'address', label: 'Address', priority: 3 },
    { key: 'capacity', label: 'Capacity', formatter: formatNumber, priority: 4 },
    { key: 'venue_type', label: 'Type', priority: 5 },
    { key: 'website_url', label: 'Website', formatter: formatUrl, priority: 6 },
    { key: 'phone', label: 'Phone', priority: 7 },
    { key: 'description', label: 'Description', truncate: 100, priority: 10 },
  ],

  recordings: [
    { key: 'title', label: 'Title', priority: 1 },
    { key: 'artist_name', label: 'Artist', priority: 2 },
    { key: 'release_date', label: 'Release Date', formatter: formatDate, priority: 3 },
    { key: 'duration_seconds', label: 'Duration', formatter: formatDuration, priority: 4 },
    { key: 'genre', label: 'Genre', priority: 5 },
    { key: 'album', label: 'Album', priority: 6 },
    { key: 'spotify_url', label: 'Spotify', formatter: formatUrl, priority: 7 },
    { key: 'soundcloud_url', label: 'SoundCloud', formatter: formatUrl, priority: 8 },
    { key: 'youtube_url', label: 'YouTube', formatter: formatUrl, priority: 9 },
    { key: 'is_published', label: 'Published', formatter: formatBoolean, priority: 10 },
  ],

  ticket_tiers: [
    { key: 'name', label: 'Tier Name', priority: 1 },
    { key: 'price', label: 'Price', formatter: formatCurrency, priority: 2 },
    { key: 'quantity_available', label: 'Quantity', formatter: formatNumber, priority: 3 },
    { key: 'quantity_sold', label: 'Sold', formatter: formatNumber, priority: 4 },
    { key: 'sale_start_date', label: 'Sale Starts', formatter: formatDateTime, priority: 5 },
    { key: 'sale_end_date', label: 'Sale Ends', formatter: formatDateTime, priority: 6 },
    { key: 'description', label: 'Description', truncate: 100, priority: 10 },
    { key: 'is_active', label: 'Active', formatter: formatBoolean, priority: 7 },
    // Hidden
    { key: 'event_id', label: 'Event ID', hidden: true },
  ],

  profiles: [
    { key: 'display_name', label: 'Display Name', priority: 1 },
    { key: 'email', label: 'Email', priority: 2 },
    { key: 'phone', label: 'Phone', priority: 3 },
    { key: 'bio', label: 'Bio', truncate: 100, priority: 10 },
    { key: 'avatar_url', label: 'Avatar', formatter: formatUrl, priority: 5 },
    { key: 'is_public', label: 'Public Profile', formatter: formatBoolean, priority: 4 },
  ],

  user_roles: [
    { key: 'role_name', label: 'Role', priority: 1 },
    { key: 'role_type', label: 'Type', priority: 2 },
    // Hidden
    { key: 'user_id', label: 'User ID', hidden: true },
  ],
};

/**
 * Get field configuration for a resource type
 * Returns sorted by priority with hidden fields filtered out
 */
export function getFieldsForResource(resourceType: string): FieldConfig[] {
  const normalizedType = resourceType.toLowerCase() as ResourceType;
  const config = FIELD_CONFIG[normalizedType];

  if (!config) {
    return [];
  }

  return config
    .filter(field => !field.hidden)
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

/**
 * Get a single field configuration by key
 */
export function getFieldConfig(
  resourceType: string,
  fieldKey: string
): FieldConfig | undefined {
  const normalizedType = resourceType.toLowerCase() as ResourceType;
  const config = FIELD_CONFIG[normalizedType];

  if (!config) return undefined;

  return config.find(field => field.key === fieldKey);
}

/**
 * Map from category to resource type
 */
export const CATEGORY_TO_RESOURCE: Record<string, ResourceType | undefined> = {
  event: 'events',
  artist: 'artists',
  venue: 'venues',
  recording: 'recordings',
  ticket_tier: 'ticket_tiers',
  account: 'profiles',
};

/**
 * Get resource type from activity log category
 */
export function getResourceTypeFromCategory(category: string): ResourceType | undefined {
  return CATEGORY_TO_RESOURCE[category];
}
