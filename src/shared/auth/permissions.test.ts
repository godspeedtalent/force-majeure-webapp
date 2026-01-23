import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  ROLE_DEPENDENCIES,
  Permission,
  Role,
  getRoleDependencies,
  getDependentRoles,
  ensureRoleDependencies,
  getRolesToRemove,
} from './permissions';

describe('PERMISSIONS', () => {
  it('has correct permission values', () => {
    expect(PERMISSIONS.MANAGE_USERS).toBe('manage_users');
    expect(PERMISSIONS.MANAGE_EVENTS).toBe('manage_events');
    expect(PERMISSIONS.MANAGE_ARTISTS).toBe('manage_artists');
    expect(PERMISSIONS.MANAGE_VENUES).toBe('manage_venues');
    expect(PERMISSIONS.MANAGE_ORGANIZATION).toBe('manage_organization');
    expect(PERMISSIONS.VIEW_ORGANIZATION).toBe('view_organization');
    expect(PERMISSIONS.SCAN_TICKETS).toBe('scan_tickets');
    expect(PERMISSIONS.ACCESS_DEV_TOOLS).toBe('access_dev_tools');
    expect(PERMISSIONS.ACCESS_DEMO_PAGES).toBe('access_demo_pages');
    expect(PERMISSIONS.ALL).toBe('*');
  });

  it('has all expected permissions', () => {
    const permissionKeys = Object.keys(PERMISSIONS);
    expect(permissionKeys).toContain('MANAGE_USERS');
    expect(permissionKeys).toContain('MANAGE_EVENTS');
    expect(permissionKeys).toContain('MANAGE_ARTISTS');
    expect(permissionKeys).toContain('MANAGE_VENUES');
    expect(permissionKeys).toContain('MANAGE_ORGANIZATION');
    expect(permissionKeys).toContain('VIEW_ORGANIZATION');
    expect(permissionKeys).toContain('SCAN_TICKETS');
    expect(permissionKeys).toContain('ACCESS_DEV_TOOLS');
    expect(permissionKeys).toContain('ACCESS_DEMO_PAGES');
    expect(permissionKeys).toContain('ALL');
  });

  it('uses snake_case for permission values', () => {
    const permissionValues = Object.values(PERMISSIONS);
    permissionValues.forEach(value => {
      if (value !== '*') {
        expect(value).toMatch(/^[a-z_]+$/);
      }
    });
  });
});

describe('ROLES', () => {
  it('has correct role values', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.DEVELOPER).toBe('developer');
    expect(ROLES.ORG_ADMIN).toBe('org_admin');
    expect(ROLES.ORG_STAFF).toBe('org_staff');
    expect(ROLES.USER).toBe('user');
  });

  it('has all expected roles', () => {
    const roleKeys = Object.keys(ROLES);
    expect(roleKeys).toEqual([
      'ADMIN',
      'DEVELOPER',
      'FM_STAFF',
      'ORG_ADMIN',
      'ORG_STAFF',
      'VENUE_ADMIN',
      'ARTIST',
      'USER',
    ]);
  });

  it('uses lowercase for role values', () => {
    const roleValues = Object.values(ROLES);
    roleValues.forEach(value => {
      expect(value).toBe(value.toLowerCase());
    });
  });
});

describe('ROLE_PERMISSIONS', () => {
  it('maps all roles to permissions', () => {
    const roles = Object.values(ROLES);
    roles.forEach(role => {
      expect(ROLE_PERMISSIONS).toHaveProperty(role);
      expect(Array.isArray(ROLE_PERMISSIONS[role as Role])).toBe(true);
    });
  });

  describe('ADMIN role', () => {
    it('has wildcard permission', () => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toContain(PERMISSIONS.ALL);
    });

    it('only has wildcard permission', () => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toHaveLength(1);
    });
  });

  describe('DEVELOPER role', () => {
    it('has development-specific permissions', () => {
      expect(ROLE_PERMISSIONS[ROLES.DEVELOPER]).toContain(
        PERMISSIONS.ACCESS_DEV_TOOLS
      );
      expect(ROLE_PERMISSIONS[ROLES.DEVELOPER]).toContain(
        PERMISSIONS.ACCESS_DEMO_PAGES
      );
    });

    it('has wildcard permission', () => {
      expect(ROLE_PERMISSIONS[ROLES.DEVELOPER]).toContain(PERMISSIONS.ALL);
    });
  });

  describe('ORG_ADMIN role', () => {
    it('has organization management permissions', () => {
      const permissions = ROLE_PERMISSIONS[ROLES.ORG_ADMIN];
      expect(permissions).toContain(PERMISSIONS.MANAGE_ORGANIZATION);
      expect(permissions).toContain(PERMISSIONS.VIEW_ORGANIZATION);
      expect(permissions).toContain(PERMISSIONS.SCAN_TICKETS);
      expect(permissions).toContain(PERMISSIONS.MANAGE_EVENTS);
    });

    it('does not have wildcard permission', () => {
      expect(ROLE_PERMISSIONS[ROLES.ORG_ADMIN]).not.toContain(
        PERMISSIONS.ALL
      );
    });

    it('does not have developer permissions', () => {
      const permissions = ROLE_PERMISSIONS[ROLES.ORG_ADMIN];
      expect(permissions).not.toContain(PERMISSIONS.ACCESS_DEV_TOOLS);
      expect(permissions).not.toContain(PERMISSIONS.ACCESS_DEMO_PAGES);
    });
  });

  describe('ORG_STAFF role', () => {
    it('has basic organization permissions', () => {
      const permissions = ROLE_PERMISSIONS[ROLES.ORG_STAFF];
      expect(permissions).toContain(PERMISSIONS.VIEW_ORGANIZATION);
      expect(permissions).toContain(PERMISSIONS.SCAN_TICKETS);
    });

    it('does not have management permissions', () => {
      const permissions = ROLE_PERMISSIONS[ROLES.ORG_STAFF];
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_ORGANIZATION);
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_EVENTS);
    });

    it('has exactly 2 permissions', () => {
      expect(ROLE_PERMISSIONS[ROLES.ORG_STAFF]).toHaveLength(2);
    });
  });

  describe('USER role', () => {
    it('has no special permissions', () => {
      expect(ROLE_PERMISSIONS[ROLES.USER]).toHaveLength(0);
    });

    it('is an empty array', () => {
      expect(ROLE_PERMISSIONS[ROLES.USER]).toEqual([]);
    });
  });

  describe('permission hierarchy', () => {
    it('ADMIN has most permissions (wildcard)', () => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toContain(PERMISSIONS.ALL);
    });

    it('ORG_ADMIN has more permissions than ORG_STAFF', () => {
      const adminPerms = ROLE_PERMISSIONS[ROLES.ORG_ADMIN].length;
      const staffPerms = ROLE_PERMISSIONS[ROLES.ORG_STAFF].length;
      expect(adminPerms).toBeGreaterThan(staffPerms);
    });

    it('ORG_STAFF has more permissions than USER', () => {
      const staffPerms = ROLE_PERMISSIONS[ROLES.ORG_STAFF].length;
      const userPerms = ROLE_PERMISSIONS[ROLES.USER].length;
      expect(staffPerms).toBeGreaterThan(userPerms);
    });
  });

  describe('permission overlap', () => {
    it('ORG_STAFF permissions are subset of ORG_ADMIN', () => {
      const staffPerms = ROLE_PERMISSIONS[ROLES.ORG_STAFF];
      const adminPerms = ROLE_PERMISSIONS[ROLES.ORG_ADMIN];
      staffPerms.forEach(perm => {
        expect(adminPerms).toContain(perm);
      });
    });
  });
});

describe('TypeScript types', () => {
  it('Permission type includes all permission values', () => {
    const testPermission: Permission = PERMISSIONS.MANAGE_USERS;
    expect(testPermission).toBe('manage_users');
  });

  it('Role type includes all role values', () => {
    const testRole: Role = ROLES.ADMIN;
    expect(testRole).toBe('admin');
  });
});

describe('Role Dependencies', () => {
  describe('ROLE_DEPENDENCIES constant', () => {
    it('defines user as dependency for org_admin', () => {
      expect(ROLE_DEPENDENCIES[ROLES.ORG_ADMIN]).toContain(ROLES.USER);
    });

    it('defines user as dependency for org_staff', () => {
      expect(ROLE_DEPENDENCIES[ROLES.ORG_STAFF]).toContain(ROLES.USER);
    });

    it('defines user as dependency for venue_admin', () => {
      expect(ROLE_DEPENDENCIES[ROLES.VENUE_ADMIN]).toContain(ROLES.USER);
    });

    it('does not define dependencies for admin', () => {
      expect(ROLE_DEPENDENCIES[ROLES.ADMIN]).toBeUndefined();
    });

    it('does not define dependencies for developer', () => {
      expect(ROLE_DEPENDENCIES[ROLES.DEVELOPER]).toBeUndefined();
    });
  });

  describe('getRoleDependencies', () => {
    it('should return user for org_admin', () => {
      const deps = getRoleDependencies(ROLES.ORG_ADMIN);
      expect(deps).toContain(ROLES.USER);
    });

    it('should return user for org_staff', () => {
      const deps = getRoleDependencies(ROLES.ORG_STAFF);
      expect(deps).toContain(ROLES.USER);
    });

    it('should return user for venue_admin', () => {
      const deps = getRoleDependencies(ROLES.VENUE_ADMIN);
      expect(deps).toContain(ROLES.USER);
    });

    it('should return empty array for admin', () => {
      const deps = getRoleDependencies(ROLES.ADMIN);
      expect(deps).toEqual([]);
    });

    it('should return empty array for developer', () => {
      const deps = getRoleDependencies(ROLES.DEVELOPER);
      expect(deps).toEqual([]);
    });

    it('should return empty array for user', () => {
      const deps = getRoleDependencies(ROLES.USER);
      expect(deps).toEqual([]);
    });
  });

  describe('getDependentRoles', () => {
    it('should return all roles that depend on user', () => {
      const dependents = getDependentRoles(ROLES.USER);
      expect(dependents).toContain(ROLES.ORG_ADMIN);
      expect(dependents).toContain(ROLES.ORG_STAFF);
      expect(dependents).toContain(ROLES.VENUE_ADMIN);
      expect(dependents).toContain(ROLES.ARTIST);
      expect(dependents).toContain(ROLES.FM_STAFF);
    });

    it('should return empty array for admin', () => {
      const dependents = getDependentRoles(ROLES.ADMIN);
      expect(dependents).toEqual([]);
    });

    it('should return empty array for developer', () => {
      const dependents = getDependentRoles(ROLES.DEVELOPER);
      expect(dependents).toEqual([]);
    });

    it('should return empty array for org_admin', () => {
      const dependents = getDependentRoles(ROLES.ORG_ADMIN);
      expect(dependents).toEqual([]);
    });
  });

  describe('ensureRoleDependencies', () => {
    it('should add user when org_admin is selected', () => {
      const result = ensureRoleDependencies([ROLES.ORG_ADMIN]);
      expect(result).toContain(ROLES.ORG_ADMIN);
      expect(result).toContain(ROLES.USER);
    });

    it('should add user when org_staff is selected', () => {
      const result = ensureRoleDependencies([ROLES.ORG_STAFF]);
      expect(result).toContain(ROLES.ORG_STAFF);
      expect(result).toContain(ROLES.USER);
    });

    it('should add user when venue_admin is selected', () => {
      const result = ensureRoleDependencies([ROLES.VENUE_ADMIN]);
      expect(result).toContain(ROLES.VENUE_ADMIN);
      expect(result).toContain(ROLES.USER);
    });

    it('should not duplicate user when multiple roles share dependency', () => {
      const result = ensureRoleDependencies([ROLES.ORG_ADMIN, ROLES.VENUE_ADMIN]);
      const userCount = result.filter(r => r === ROLES.USER).length;
      expect(userCount).toBe(1);
    });

    it('should handle roles with no dependencies', () => {
      const result = ensureRoleDependencies([ROLES.ADMIN]);
      expect(result).toEqual([ROLES.ADMIN]);
    });

    it('should handle empty array', () => {
      const result = ensureRoleDependencies([]);
      expect(result).toEqual([]);
    });

    it('should not add extra dependencies when user is already included', () => {
      const result = ensureRoleDependencies([ROLES.ORG_ADMIN, ROLES.USER]);
      expect(result).toContain(ROLES.ORG_ADMIN);
      expect(result).toContain(ROLES.USER);
      expect(result.length).toBe(2);
    });
  });

  describe('getRolesToRemove', () => {
    it('should remove org_admin when user is removed', () => {
      const roles = [ROLES.USER, ROLES.ORG_ADMIN];
      const toRemove = getRolesToRemove(roles, ROLES.USER);
      expect(toRemove).toContain(ROLES.USER);
      expect(toRemove).toContain(ROLES.ORG_ADMIN);
    });

    it('should remove org_staff when user is removed', () => {
      const roles = [ROLES.USER, ROLES.ORG_STAFF];
      const toRemove = getRolesToRemove(roles, ROLES.USER);
      expect(toRemove).toContain(ROLES.USER);
      expect(toRemove).toContain(ROLES.ORG_STAFF);
    });

    it('should remove multiple dependents when user is removed', () => {
      const roles = [ROLES.USER, ROLES.ORG_ADMIN, ROLES.ORG_STAFF, ROLES.VENUE_ADMIN, ROLES.ARTIST, ROLES.FM_STAFF];
      const toRemove = getRolesToRemove(roles, ROLES.USER);
      expect(toRemove).toContain(ROLES.USER);
      expect(toRemove).toContain(ROLES.ORG_ADMIN);
      expect(toRemove).toContain(ROLES.ORG_STAFF);
      expect(toRemove).toContain(ROLES.VENUE_ADMIN);
      expect(toRemove).toContain(ROLES.ARTIST);
      expect(toRemove).toContain(ROLES.FM_STAFF);
    });

    it('should return only the role if no dependents in selection', () => {
      const roles = [ROLES.USER, ROLES.ADMIN];
      const toRemove = getRolesToRemove(roles, ROLES.ADMIN);
      expect(toRemove).toEqual([ROLES.ADMIN]);
    });

    it('should not remove roles that are not in the original array', () => {
      const roles = [ROLES.USER];
      const toRemove = getRolesToRemove(roles, ROLES.USER);
      expect(toRemove).toEqual([ROLES.USER]);
      expect(toRemove).not.toContain(ROLES.ORG_ADMIN);
    });

    it('should handle removing a role with no dependents', () => {
      const roles = [ROLES.ADMIN, ROLES.DEVELOPER];
      const toRemove = getRolesToRemove(roles, ROLES.DEVELOPER);
      expect(toRemove).toEqual([ROLES.DEVELOPER]);
    });
  });
});
