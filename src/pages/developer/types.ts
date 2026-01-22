/**
 * Types for DeveloperHome page
 */

export type DeveloperTab =
  // Developer Tools
  | 'dev_demo'
  | 'dev_docs'
  | 'dev_order_import'
  | 'dev_template_designer'
  | 'dev_role_diagnostics'
  // Admin Controls
  | 'admin_settings'
  | 'admin_ticketing'
  | 'admin_role_matrix'
  // Dashboards
  | 'dash_recordings'
  | 'dash_analytics'
  // Messages - Activity Logs
  | 'logs_all'
  // Database - Overview
  | 'db_overview'
  // Database - Tables
  | 'db_artists'
  | 'db_events'
  | 'db_guests'
  | 'db_recordings'
  | 'db_venues'
  | 'db_organizations'
  | 'db_users'
  // Database - Storage
  | 'db_galleries'
  // Database - Messages
  | 'db_registrations';

export const VALID_TABS: DeveloperTab[] = [
  'dev_demo',
  'dev_docs',
  'dev_order_import',
  'dev_template_designer',
  'dev_role_diagnostics',
  'admin_settings',
  'admin_ticketing',
  'admin_role_matrix',
  'dash_recordings',
  'dash_analytics',
  'logs_all',
  'db_overview',
  'db_artists',
  'db_events',
  'db_guests',
  'db_recordings',
  'db_venues',
  'db_organizations',
  'db_users',
  'db_galleries',
  'db_registrations',
];

// External navigation mapping (pages that still open as separate routes)
// Currently empty - all developer tools are now inline tabs or linked from Demo Tools
export const EXTERNAL_ROUTES: Partial<Record<DeveloperTab, string>> = {};
