/**
 * Staff Home Tab Types
 *
 * Defines tab identifiers for the staff management interface.
 * These tabs are separated from developer tools to provide a focused
 * interface for organization staff and administrators.
 */

export type StaffTab =
  // Dashboards
  | 'dash_users' // User Metrics Dashboard
  | 'dash_overview' // Staff Dashboard (placeholder for new dashboard)

  // Messages
  | 'logs_contact' // Contact Submissions
  | 'db_user_requests'; // User Requests

/**
 * Tab counts for badge display in navigation
 */
export interface StaffTabCounts {
  pendingContacts?: number;
  pendingRequests?: number;
}
