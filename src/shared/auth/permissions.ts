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
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

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
  ARTIST: 'artist',
  USER: 'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role-to-permission mapping
 * Defines what each role can do (for reference and validation)
 *
 * Note: The actual permissions are managed in the database.
 * This is a reference map for understanding role capabilities.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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
  [ROLES.ARTIST]: [], // Artist role - no additional permissions for now
  [ROLES.USER]: [],
};

/**
 * Role Dependencies
 * Defines which roles require other roles to be present.
 * Key = role that has dependencies, Value = array of required roles
 *
 * Example: Artist role requires User role (artists must be users)
 */
export const ROLE_DEPENDENCIES: Partial<Record<Role, Role[]>> = {
  [ROLES.ARTIST]: [ROLES.USER],
  [ROLES.ORG_ADMIN]: [ROLES.USER],
  [ROLES.ORG_STAFF]: [ROLES.USER],
  [ROLES.VENUE_ADMIN]: [ROLES.USER],
  // Admin and Developer don't require User as they are elevated roles
};

/**
 * Role Exclusions
 * Defines which roles cannot coexist with other roles.
 * Key = role, Value = array of roles it excludes
 *
 * Example: Admin is mutually exclusive with lower roles for simulation
 * (though in practice, an admin wouldn't need to also have user role assigned)
 */
export const ROLE_EXCLUSIONS: Partial<Record<Role, Role[]>> = {
  // No strict exclusions currently - roles can stack
  // Add entries here if needed, e.g.:
  // [ROLES.ADMIN]: [ROLES.USER], // Admin excludes basic user (for simulation clarity)
};

/**
 * Get all roles that are required by the given role
 */
export function getRoleDependencies(role: Role): Role[] {
  return ROLE_DEPENDENCIES[role] || [];
}

/**
 * Get all roles that would be excluded by selecting the given role
 */
export function getRoleExclusions(role: Role): Role[] {
  return ROLE_EXCLUSIONS[role] || [];
}

/**
 * Get all roles that depend on the given role
 * (roles that would need to be removed if this role is removed)
 */
export function getDependentRoles(role: Role): Role[] {
  const dependents: Role[] = [];
  for (const [dependentRole, dependencies] of Object.entries(ROLE_DEPENDENCIES)) {
    if (dependencies?.includes(role)) {
      dependents.push(dependentRole as Role);
    }
  }
  return dependents;
}

/**
 * Given a set of roles, ensure all dependencies are satisfied
 * Returns the roles plus any required dependencies
 */
export function ensureRoleDependencies(roles: Role[]): Role[] {
  const result = new Set(roles);

  for (const role of roles) {
    const deps = getRoleDependencies(role);
    deps.forEach(dep => result.add(dep));
  }

  return Array.from(result);
}

/**
 * Given a set of roles and a role being removed,
 * determine which roles should also be removed (dependents)
 */
export function getRolesToRemove(roles: Role[], roleToRemove: Role): Role[] {
  const toRemove = new Set<Role>([roleToRemove]);

  // Find all roles that depend on the role being removed
  const dependents = getDependentRoles(roleToRemove);
  for (const dep of dependents) {
    if (roles.includes(dep)) {
      toRemove.add(dep);
    }
  }

  return Array.from(toRemove);
}
