/**
 * Activity Logs Types
 *
 * Type definitions for the activity logging system.
 * These types mirror the database schema for activity_logs table.
 */

/**
 * Activity categories matching the database enum
 */
export type ActivityCategory =
  | 'account'
  | 'event'
  | 'artist'
  | 'venue'
  | 'recording'
  | 'ticket_tier'
  | 'ticket'
  | 'system'
  | 'contact';

/**
 * Activity event types matching the database enum
 */
export type ActivityEventType =
  // Account events
  | 'account_created'
  | 'role_assigned'
  | 'role_removed'
  | 'permission_changed'
  // Resource CUD events
  | 'resource_created'
  | 'resource_updated'
  | 'resource_deleted'
  // Ticket events
  | 'ticket_sold'
  | 'ticket_scanned'
  | 'ticket_refunded'
  | 'ticket_cancelled'
  // Contact events
  | 'contact_submission';

/**
 * Activity log entry from the database
 */
export interface ActivityLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  event_type: ActivityEventType;
  category: ActivityCategory;
  description: string;
  target_resource_type: string | null;
  target_resource_id: string | null;
  target_resource_name: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined user data (when fetched with profile info)
  user?: {
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Archived activity log entry
 */
export interface ArchivedActivityLog extends ActivityLog {
  archived_at: string;
}

/**
 * Filter parameters for querying activity logs
 */
export interface ActivityLogFilters {
  /** Filter by category (multiple allowed) */
  categories?: ActivityCategory[];
  /** Filter by event type (multiple allowed) */
  eventTypes?: ActivityEventType[];
  /** Filter by user ID */
  userId?: string;
  /** Filter by target resource type */
  targetResourceType?: string;
  /** Filter by target resource ID */
  targetResourceId?: string;
  /** Start date for timestamp filter */
  dateFrom?: string;
  /** End date for timestamp filter */
  dateTo?: string;
  /** Search term for description or resource name */
  search?: string;
}

/**
 * Paginated response for activity logs
 */
export interface PaginatedActivityLogs {
  data: ActivityLog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Summary counts by category
 */
export interface ActivityLogSummary {
  category: ActivityCategory;
  count: number;
}

/**
 * Grouped activity log for UI display
 * Used to show aggregated entries like "56 tickets scanned"
 */
export interface GroupedActivityLog {
  /** Unique key for the group */
  groupKey: string;
  /** Representative log entry (first in group) */
  representativeLog: ActivityLog;
  /** All logs in this group */
  logs: ActivityLog[];
  /** Number of logs in group */
  count: number;
  /** Aggregated description (e.g., "56 tickets scanned for Event X") */
  aggregatedDescription: string;
  /** Whether this group is expandable (count > 1) */
  isExpandable: boolean;
}

/**
 * Display configuration for activity categories
 */
export const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; color: string; icon: string }
> = {
  account: { label: 'Account', color: 'text-blue-400', icon: 'User' },
  event: { label: 'Event', color: 'text-purple-400', icon: 'Calendar' },
  artist: { label: 'Artist', color: 'text-pink-400', icon: 'Music' },
  venue: { label: 'Venue', color: 'text-green-400', icon: 'MapPin' },
  recording: { label: 'Recording', color: 'text-orange-400', icon: 'Disc' },
  ticket_tier: { label: 'Ticket Tier', color: 'text-yellow-400', icon: 'Tag' },
  ticket: { label: 'Ticket', color: 'text-fm-gold', icon: 'Ticket' },
  system: { label: 'System', color: 'text-gray-400', icon: 'Settings' },
  contact: { label: 'Contact', color: 'text-cyan-400', icon: 'Mail' },
};

/**
 * Display configuration for activity event types
 */
export const EVENT_TYPE_CONFIG: Record<
  ActivityEventType,
  { label: string; verb: string }
> = {
  account_created: { label: 'Account Created', verb: 'created' },
  role_assigned: { label: 'Role Assigned', verb: 'assigned' },
  role_removed: { label: 'Role Removed', verb: 'removed' },
  permission_changed: { label: 'Permission Changed', verb: 'changed' },
  resource_created: { label: 'Created', verb: 'created' },
  resource_updated: { label: 'Updated', verb: 'updated' },
  resource_deleted: { label: 'Deleted', verb: 'deleted' },
  ticket_sold: { label: 'Ticket Sold', verb: 'sold' },
  ticket_scanned: { label: 'Ticket Scanned', verb: 'scanned' },
  ticket_refunded: { label: 'Ticket Refunded', verb: 'refunded' },
  ticket_cancelled: { label: 'Ticket Cancelled', verb: 'cancelled' },
  contact_submission: { label: 'Contact Submission', verb: 'submitted' },
};

/**
 * All available categories for filter UI
 */
export const ALL_CATEGORIES: ActivityCategory[] = [
  'account',
  'event',
  'artist',
  'venue',
  'recording',
  'ticket_tier',
  'ticket',
  'system',
  'contact',
];

/**
 * All available event types for filter UI
 */
export const ALL_EVENT_TYPES: ActivityEventType[] = [
  'account_created',
  'role_assigned',
  'role_removed',
  'permission_changed',
  'resource_created',
  'resource_updated',
  'resource_deleted',
  'ticket_sold',
  'ticket_scanned',
  'ticket_refunded',
  'ticket_cancelled',
  'contact_submission',
];
