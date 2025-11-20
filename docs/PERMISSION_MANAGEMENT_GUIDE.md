# Permission & Role Management - Usage Guide

## Overview

The Force Majeure app now has a centralized, type-safe permission and role management system. This guide shows you how to use it effectively.

## ⚡ Admin Role Override

**IMPORTANT**: Users with the `admin` role automatically bypass ALL permission and role checks. You only need to assign the `admin` role in the database - there's no need to assign individual permissions or other roles to admins.

```typescript
// Admins automatically pass ALL of these checks:
hasPermission(PERMISSIONS.MANAGE_ORGANIZATION); // ✅ true for admins
hasAnyRole(ROLES.DEVELOPER, ROLES.ORG_ADMIN); // ✅ true for admins
hasAllPermissions(PERMISSIONS.MANAGE_EVENTS, PERMISSIONS.SCAN_TICKETS); // ✅ true for admins
```

## Core Concepts

### 1. Central Registry (`src/shared/auth/permissions.ts`)

All permissions and roles are defined in one place:

```typescript
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

// Use these constants instead of strings:
PERMISSIONS.MANAGE_ORGANIZATION;
PERMISSIONS.SCAN_TICKETS;
PERMISSIONS.MANAGE_EVENTS;
// etc...

ROLES.ADMIN; // 👑 Automatically grants all permissions
ROLES.DEVELOPER;
ROLES.ORG_ADMIN;
ROLES.ORG_STAFF;
// etc...
```

### 2. Enhanced Permission Hook

The `useUserPermissions` hook provides comprehensive permission checking:

```typescript
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

const MyComponent = () => {
  const {
    isAdmin, // ⭐ Check if user is admin (bypasses all other checks)
    hasPermission, // Check single permission (admins auto-pass)
    hasAnyPermission, // Check if user has ANY of the permissions (admins auto-pass)
    hasAllPermissions, // Check if user has ALL of the permissions (admins auto-pass)
    hasRole, // Check single role
    hasAnyRole, // Check if user has ANY of the roles (admins auto-pass)
    getRoles, // Get all user roles
    getPermissions, // Get all user permissions
  } = useUserPermissions();

  const canManage = hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);
  const userIsAdmin = isAdmin(); // Direct admin check
  const hasOrgAccess = hasAnyPermission(
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_ORGANIZATION
  );
};
```

## Common Patterns

### Pattern 1: Route Protection

Use `<ProtectedRoute>` to protect entire routes based on permissions or roles. **Admins automatically have access to all protected routes.**

```typescript
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

// Protect by permission (admins automatically have access)
<Route
  path="/organization/tools"
  element={
    <ProtectedRoute permission={PERMISSIONS.MANAGE_ORGANIZATION}>
      <OrganizationTools />
    </ProtectedRoute>
  }
/>

// Protect by role (admins automatically have access)
<Route
  path="/dev/controls"
  element={
    <ProtectedRoute role={ROLES.DEVELOPER}>
      <DevControls />
    </ProtectedRoute>
  }
/>

// Require ALL permissions (admins automatically have access)
<Route
  path="/advanced-tools"
  element={
    <ProtectedRoute
      permission={[PERMISSIONS.MANAGE_EVENTS, PERMISSIONS.SCAN_TICKETS]}
      requireAll
    >
      <AdvancedTools />
    </ProtectedRoute>
  }
/>

// Custom redirect location
<Route
  path="/sensitive"
  element={
    <ProtectedRoute
      permission={PERMISSIONS.MANAGE_USERS}
      redirectTo="/unauthorized"
    >
      <SensitivePage />
    </ProtectedRoute>
  }
/>
```

### Pattern 2: Conditional Rendering

Use `<PermissionGuard>` to conditionally show UI elements:

```typescript
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show only if user can manage organization */}
      <PermissionGuard permission={PERMISSIONS.MANAGE_ORGANIZATION}>
        <AdminPanel />
      </PermissionGuard>

      {/* Show only if user has admin or developer role */}
      <PermissionGuard role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
        <DevTools />
      </PermissionGuard>

      {/* Show fallback content if no access */}
      <PermissionGuard
        permission={PERMISSIONS.SCAN_TICKETS}
        fallback={<p>You need scanning permissions to view this.</p>}
      >
        <ScannerTools />
      </PermissionGuard>

      {/* Require ALL permissions */}
      <PermissionGuard
        permission={[PERMISSIONS.MANAGE_EVENTS, PERMISSIONS.MANAGE_VENUES]}
        requireAll
      >
        <AdvancedEventManagement />
      </PermissionGuard>
    </div>
  );
};
```

### Pattern 3: Programmatic Checks

Use the hook directly for conditional logic:

```typescript
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

const MyComponent = () => {
  const { hasPermission, hasRole, hasAnyPermission } = useUserPermissions();

  const handleAction = () => {
    if (!hasPermission(PERMISSIONS.MANAGE_EVENTS)) {
      toast({ title: 'Unauthorized', variant: 'destructive' });
      return;
    }
    // Proceed with action
  };

  const canEditProfile = hasAnyPermission(
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_ORGANIZATION
  );

  return (
    <div>
      <Button
        onClick={handleAction}
        disabled={!hasPermission(PERMISSIONS.MANAGE_EVENTS)}
      >
        Manage Event
      </Button>

      {hasRole(ROLES.ADMIN) && <AdminBadge />}
    </div>
  );
};
```

### Pattern 4: Menu Items

Conditionally show menu items based on permissions:

```typescript
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/shared/auth/permissions';

const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => navigate('/profile')}>
        Profile
      </DropdownMenuItem>

      <PermissionGuard permission={PERMISSIONS.MANAGE_ORGANIZATION}>
        <DropdownMenuItem onClick={() => navigate('/organization/tools')}>
          Org Tools
        </DropdownMenuItem>
      </PermissionGuard>

      <PermissionGuard permission={PERMISSIONS.SCAN_TICKETS}>
        <DropdownMenuItem onClick={() => navigate('/organization/scanning')}>
          Scanning
        </DropdownMenuItem>
      </PermissionGuard>

      <DropdownMenuItem onClick={signOut}>
        Sign Out
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
```

## Advanced Usage

### Multiple Permission Checks

```typescript
const { hasAllPermissions, hasAnyPermission } = useUserPermissions();

// User must have BOTH permissions
const canDoAdvanced = hasAllPermissions(
  PERMISSIONS.MANAGE_EVENTS,
  PERMISSIONS.SCAN_TICKETS
);

// User needs at least ONE of these permissions
const hasOrgAccess = hasAnyPermission(
  PERMISSIONS.MANAGE_ORGANIZATION,
  PERMISSIONS.VIEW_ORGANIZATION
);
```

### Get All Permissions/Roles

```typescript
const { getRoles, getPermissions } = useUserPermissions();

const userRoles = getRoles(); // ['org_admin', 'org_staff']
const userPermissions = getPermissions(); // ['manage_organization', 'scan_tickets', ...]

// Use for debugging or display
console.log('User has roles:', userRoles);
console.log('User has permissions:', userPermissions);
```

## Migration Guide

### Before (Anti-pattern ❌)

```typescript
// Hard-coded strings
const isAdmin = hasRole('admin');
const canManage = hasPermission('manage_organization');

// No type safety
if (role === 'org_admin') { ... }
```

### After (Best practice ✅)

```typescript
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

// Type-safe constants
const isAdmin = hasRole(ROLES.ADMIN);
const canManage = hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);

// Full type safety and autocomplete
if (role === ROLES.ORG_ADMIN) { ... }
```

## Benefits

1. **Type Safety** - TypeScript ensures you use valid permissions/roles
2. **Autocomplete** - IDE suggests available permissions/roles
3. **Refactoring** - Change permission names in one place
4. **Discoverable** - All permissions visible in one file
5. **DRY** - No repeated permission logic
6. **Testable** - Easy to mock and test
7. **Maintainable** - Clear separation of concerns

## Best Practices

1. ✅ Always import from `@/shared/auth/permissions`
2. ✅ Use constants instead of strings
3. ✅ Use `<ProtectedRoute>` for route-level protection
4. ✅ Use `<PermissionGuard>` for conditional rendering
5. ✅ Use hooks for programmatic checks
6. ❌ Don't hard-code permission/role strings
7. ❌ Don't duplicate permission logic
8. ❌ Don't check permissions in multiple places
