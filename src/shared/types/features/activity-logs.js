/**
 * Activity Logs Types
 *
 * Type definitions for the activity logging system.
 * These types mirror the database schema for activity_logs table.
 */
/**
 * Display configuration for activity categories
 */
export const CATEGORY_CONFIG = {
    account: { label: 'Account', color: 'text-blue-400', icon: 'User' },
    event: { label: 'Event', color: 'text-purple-400', icon: 'Calendar' },
    artist: { label: 'Artist', color: 'text-pink-400', icon: 'Music' },
    venue: { label: 'Venue', color: 'text-green-400', icon: 'MapPin' },
    recording: { label: 'Recording', color: 'text-orange-400', icon: 'Disc' },
    ticket_tier: { label: 'Ticket Tier', color: 'text-yellow-400', icon: 'Tag' },
    ticket: { label: 'Ticket', color: 'text-fm-gold', icon: 'Ticket' },
    system: { label: 'System', color: 'text-gray-400', icon: 'Settings' },
};
/**
 * Display configuration for activity event types
 */
export const EVENT_TYPE_CONFIG = {
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
};
/**
 * All available categories for filter UI
 */
export const ALL_CATEGORIES = [
    'account',
    'event',
    'artist',
    'venue',
    'recording',
    'ticket_tier',
    'ticket',
    'system',
];
/**
 * All available event types for filter UI
 */
export const ALL_EVENT_TYPES = [
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
];
