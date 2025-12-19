/**
 * Central registry of all permissions in the system
 * Use these constants instead of hard-coded strings for type safety
 */
export const PERMISSIONS = {
    // Admin permissions
    MANAGE_USERS: 'manage_users',
    MANAGE_EVENTS: 'manage_events',
    MANAGE_ARTISTS: 'manage_artists',
    MANAGE_VENUES: 'manage_venues',
    MANAGE_ORGANIZATION: 'manage_organization',
    VIEW_ORGANIZATION: 'view_organization',
    // Scanning permissions
    SCAN_TICKETS: 'scan_tickets',
    // Developer permissions
    ACCESS_DEV_TOOLS: 'access_dev_tools',
    ACCESS_DEMO_PAGES: 'access_demo_pages',
    // Wildcard
    ALL: '*',
};
/**
 * Central registry of all roles in the system
 * Use these constants instead of hard-coded strings for type safety
 */
export const ROLES = {
    ADMIN: 'admin',
    DEVELOPER: 'developer',
    ORG_ADMIN: 'org_admin',
    ORG_STAFF: 'org_staff',
    VENUE_ADMIN: 'venue_admin',
    USER: 'user',
};
/**
 * Role-to-permission mapping
 * Defines what each role can do (for reference and validation)
 *
 * Note: The actual permissions are managed in the database.
 * This is a reference map for understanding role capabilities.
 */
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [PERMISSIONS.ALL],
    [ROLES.DEVELOPER]: [
        PERMISSIONS.ACCESS_DEV_TOOLS,
        PERMISSIONS.ACCESS_DEMO_PAGES,
        PERMISSIONS.ALL, // Devs have full access in dev mode
    ],
    [ROLES.ORG_ADMIN]: [
        PERMISSIONS.MANAGE_ORGANIZATION,
        PERMISSIONS.VIEW_ORGANIZATION,
        PERMISSIONS.SCAN_TICKETS,
        PERMISSIONS.MANAGE_EVENTS,
    ],
    [ROLES.ORG_STAFF]: [PERMISSIONS.VIEW_ORGANIZATION, PERMISSIONS.SCAN_TICKETS],
    [ROLES.VENUE_ADMIN]: [PERMISSIONS.MANAGE_VENUES],
    [ROLES.USER]: [],
};
