/**
 * Types for DeveloperHome page
 */

export type DeveloperTab =
  // Developer Tools (external links)
  | 'dev_demo'
  | 'dev_docs'
  | 'dev_ticket_flow'
  // Admin Controls
  | 'admin_settings'
  | 'admin_devtools'
  | 'admin_ticketing'
  // Dashboards
  | 'dash_recordings'
  | 'dash_users'
  | 'dash_analytics'
  // Activity Logs
  | 'logs_all'
  | 'logs_account'
  | 'logs_event'
  | 'logs_ticket'
  | 'logs_contact'
  // Database - Overview
  | 'db_overview'
  // Database - Tables
  | 'db_artists'
  | 'db_events'
  | 'db_recordings'
  | 'db_venues'
  | 'db_organizations'
  | 'db_users'
  // Database - Storage
  | 'db_galleries'
  // Database - Messages
  | 'db_registrations'
  | 'db_user_requests';

export const VALID_TABS: DeveloperTab[] = [
  'dev_demo',
  'dev_docs',
  'dev_ticket_flow',
  'admin_settings',
  'admin_devtools',
  'admin_ticketing',
  'dash_recordings',
  'dash_users',
  'dash_analytics',
  'logs_all',
  'logs_account',
  'logs_event',
  'logs_ticket',
  'logs_contact',
  'db_overview',
  'db_artists',
  'db_events',
  'db_recordings',
  'db_venues',
  'db_organizations',
  'db_users',
  'db_galleries',
  'db_registrations',
  'db_user_requests',
];

// External navigation mapping
export const EXTERNAL_ROUTES: Partial<Record<DeveloperTab, string>> = {
  dev_demo: '/developer/demo',
  dev_docs: '/developer/documentation',
  dev_ticket_flow: '/developer/ticket-flow',
};
