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

  // Requests
  | 'db_user_requests' // User Requests
  | 'db_registrations'; // Artist Registrations

/**
 * Tab counts for badge display in navigation
 */
export interface StaffTabCounts {
  pendingRequests?: number;
  pendingRegistrations?: number;
}
