# Permission Architecture: Client vs Server

**Purpose:** Clarify the security model and roles of client-side vs server-side permission checks
**Status:** 🟢 Active Documentation
**Last Updated:** 2026-01-24

---

## Critical Understanding: Two Permission Layers

The Force Majeure application has **two distinct permission layers** that serve different purposes:

| Layer | Location | Purpose | Security Value |
|-------|----------|---------|----------------|
| **Server-Side (RLS)** | PostgreSQL Database | **ENFORCEMENT** | ✅ HIGH - Actual security boundary |
| **Client-Side (React)** | React Components | **USER EXPERIENCE** | ❌ LOW - UX only, not security |

### The Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Components                                       │ │
│  │  - useUserPermissions() hook                           │ │
│  │  - <PermissionGuard> component                         │ │
│  │  - <ProtectedRoute> component                          │ │
│  │                                                          │ │
│  │  Purpose: Hide UI elements, show loading states        │ │
│  │  Security Value: NONE (can be bypassed)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP Request
┌─────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase / PostgreSQL                                  │ │
│  │  - Row-Level Security (RLS) policies                   │ │
│  │  - has_role() / has_permission() SQL functions         │ │
│  │  - GRANT/REVOKE permissions                            │ │
│  │                                                          │ │
│  │  Purpose: ENFORCE access control at database level     │ │
│  │  Security Value: HIGH (actual security boundary)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Client-Side Permissions (UX Layer)

### Purpose

Client-side permission checks exist **purely for user experience**:

1. **Hide unavailable features** - Don't show buttons users can't use
2. **Show loading states** - Display spinners while checking permissions
3. **Provide feedback** - Show "Access Denied" messages gracefully
4. **Reduce failed requests** - Don't make API calls that will fail

### Implementation

**Location:** `/src/shared/hooks/useUserRole.ts` (lines 135-314)

```typescript
// This runs in the browser - can be bypassed!
export const useUserPermissions = () => {
  const { roles, loading } = useRoles();

  const hasPermission = (permission: Permission): boolean => {
    if (isAdmin()) return true; // Check admin first

    const effectiveRoles = getEffectiveRoles();
    return effectiveRoles.some(role =>
      role.permission_names.includes(PERMISSIONS.ALL) ||
      role.permission_names.includes(permission)
    );
  };

  // ... more helper methods
};
```

### Common Patterns

**1. Conditional Rendering**

```tsx
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS } from '@/shared/auth/permissions';

function MyComponent() {
  const { hasPermission } = useUserPermissions();

  return (
    <div>
      {/* Only show delete button if user has permission */}
      {hasPermission(PERMISSIONS.MANAGE_EVENTS) && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
}
```

**2. Permission Guard Component**

```tsx
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PERMISSIONS } from '@/shared/auth/permissions';

<PermissionGuard permission={PERMISSIONS.MANAGE_EVENTS}>
  <EventManagementTools />
</PermissionGuard>
```

**3. Protected Routes**

```tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { PERMISSIONS } from '@/shared/auth/permissions';

<Route
  path="/admin/*"
  element={
    <ProtectedRoute permission={PERMISSIONS.MANAGE_ORGANIZATION}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

### ⚠️ Security Warning

**Client-side checks provide NO security:**

- User can modify React state in browser
- User can call Supabase directly from browser console
- User can bypass React Router entirely
- Determined attacker will bypass all client checks

**Example Attack:**

```javascript
// In browser console, bypass client checks
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', 'other-user-id'); // Try to access other user's data

// This will fail due to RLS policy, not React permissions!
// RLS policy checks user_id = auth.uid() at database level
```

---

## Server-Side Permissions (Security Layer)

### Purpose

Server-side permission checks **enforce actual security**:

1. **Data access control** - Who can read which rows
2. **Mutation control** - Who can insert/update/delete
3. **Defense in depth** - Multiple layers of protection
4. **Compliance** - Meet security audit requirements

### Implementation

**Location:** `/supabase/migrations/*.sql` (RLS policies)

#### 1. RLS Policies

```sql
-- Example: orders table RLS policy
CREATE POLICY "Users can only view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR  -- Owner can view
    has_role(auth.uid(), 'admin') OR  -- Admin can view all
    has_role(auth.uid(), 'developer')  -- Developer can view all
  );

CREATE POLICY "Users can only update own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin')
  );
```

**Key Points:**
- `USING` clause: Restricts which rows user can see/modify
- `WITH CHECK` clause: Validates new/updated row values
- `auth.uid()`: PostgreSQL function that gets current user ID from JWT
- `has_role()`: Custom function that checks user's roles

#### 2. Helper Functions

**File:** Various migrations creating RLS helper functions

```sql
-- Check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id uuid, role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1
    AND r.role_name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id uuid, permission_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1
    AND (p.permission_name = $2 OR p.permission_name = '*')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Admin Auto-Bypass Pattern

**Special handling for admin role:**

```sql
-- Admin role automatically passes all checks
CREATE POLICY "Policy name"
  ON public.table_name
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR  -- Admin bypass FIRST
    has_role(auth.uid(), 'developer') OR
    /* ...other conditions... */
  );
```

This mirrors the client-side pattern where admins automatically pass all `hasPermission()` checks.

### RLS Enforcement

**How RLS works:**

1. User makes authenticated request to Supabase
2. Request includes JWT token with `user_id`
3. PostgreSQL extracts user ID via `auth.uid()`
4. RLS policy evaluates `USING` clause for SELECT/UPDATE/DELETE
5. RLS policy evaluates `WITH CHECK` clause for INSERT/UPDATE
6. Query returns only rows passing policy checks
7. Mutations fail if policy checks fail

**Result:** Even if user bypasses client-side checks, they **cannot bypass RLS**.

---

## Permission Flow Diagram

### Example: Deleting an Event

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User clicks "Delete Event" button                         │
│    Location: EventManagement.tsx                             │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Client-side check (UX)                                    │
│    hasPermission(PERMISSIONS.MANAGE_EVENTS)                  │
│    - If false: Button is hidden, user never sees it         │
│    - If true: Proceed to API call                            │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. API call to Supabase                                      │
│    await supabase.from('events').delete().eq('id', eventId)  │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Server-side check (SECURITY)                              │
│    PostgreSQL RLS policy evaluates:                          │
│    - Is user authenticated?                                  │
│    - Does user have admin role?                              │
│    - OR is user the event owner?                             │
│    - OR is user org_admin for event's organization?          │
│                                                               │
│    If ANY condition true: DELETE succeeds                    │
│    If ALL conditions false: DELETE fails with error          │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Result returned to client                                 │
│    - Success: Show toast "Event deleted"                     │
│    - Error: Show toast "Access denied"                       │
└──────────────────────────────────────────────────────────────┘
```

### Attack Scenario: Bypassing Client Checks

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Attacker opens browser console                            │
│    Bypasses React UI entirely                                │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Attacker calls Supabase directly                          │
│    const { data } = await supabase                           │
│      .from('events')                                         │
│      .delete()                                               │
│      .eq('id', 'victim-event-id');                           │
│                                                               │
│    Client-side checks: BYPASSED ❌                           │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Server-side check (SECURITY)                              │
│    PostgreSQL RLS policy evaluates:                          │
│    - Attacker is authenticated ✅                            │
│    - Attacker has admin role? ❌                             │
│    - Attacker is event owner? ❌                             │
│    - Attacker is org_admin? ❌                               │
│                                                               │
│    ALL conditions false: DELETE BLOCKED ✅                   │
└────────────────┬─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Error returned to attacker                                │
│    Error: "new row violates row-level security policy"      │
│    Attack FAILED - RLS prevented unauthorized access ✅      │
└──────────────────────────────────────────────────────────────┘
```

**Key Takeaway:** Even though attacker bypassed client checks, **RLS blocked the attack**.

---

## Mock Role System (Testing Only)

### Purpose

The mock role system allows developers/admins to **test** the application from different user perspectives without actually switching accounts.

**Location:** `/src/contexts/MockRoleContext.tsx`

### How It Works

```typescript
// Developer can simulate being an org_staff user
const { mockRoles, setMockRoles } = useMockRole();

// Set mock roles
setMockRoles(['org_staff']);

// Now hasRole() and hasPermission() use mock roles instead of real ones
const { hasRole } = useUserPermissions();
hasRole(ROLES.ORG_STAFF); // Returns true (mocked)
```

### Security Implications

**Client-Side:** Mock roles work perfectly for testing UI
- Buttons appear/disappear as expected
- Routes become accessible
- UI behaves like user has those roles

**Server-Side:** Mock roles have **zero effect** on RLS
- Database still uses real user ID and roles
- API calls fail if user doesn't actually have permission
- RLS policies ignore mock roles entirely

**Example:**

```typescript
// Developer sets mock role to 'org_staff'
setMockRoles(['org_staff']);

// UI now shows org_staff buttons and routes ✅

// But API call to modify organization:
await supabase
  .from('organizations')
  .update({ name: 'Hacked' })
  .eq('id', 'some-org-id');

// This FAILS ❌ because RLS checks REAL roles, not mock roles
// Developer doesn't actually have org_staff role in database
```

### Access Control

Mock roles are only available to:
- Users with `admin` role
- Users with `developer` role

Regular users cannot access mock role functionality.

---

## Best Practices

### For Developers

#### ✅ DO

1. **Use client checks for UX only**
   ```tsx
   {hasPermission(PERMISSIONS.DELETE) && <DeleteButton />}
   ```

2. **Always implement matching RLS policy**
   ```sql
   CREATE POLICY "Delete policy"
     ON table
     FOR DELETE
     USING (/* same logic as client hasPermission() */);
   ```

3. **Test with mock roles**
   ```typescript
   // Test UI as different user types
   setMockRoles(['org_staff']);
   // Verify buttons show/hide correctly
   ```

4. **Document security model**
   ```typescript
   // Comment explaining security model
   // Note: Client check is UX only, RLS enforces actual security
   {hasPermission(PERMISSIONS.MANAGE_EVENTS) && <Button />}
   ```

#### ❌ DON'T

1. **Don't rely on client checks for security**
   ```tsx
   // ❌ BAD - No RLS policy exists for this table
   {hasPermission(PERMISSIONS.DELETE) && <DeleteButton />}
   ```

2. **Don't skip RLS because "UI prevents it"**
   ```sql
   -- ❌ BAD - No RLS policy
   -- "Users won't see delete button anyway"
   -- WRONG - Attackers bypass UI!
   ```

3. **Don't assume mock roles affect database**
   ```typescript
   // ❌ BAD - Expecting mock roles to work in API call
   setMockRoles(['admin']);
   await supabase.from('users').delete(); // Will fail!
   ```

4. **Don't create client-only permission checks without server equivalent**
   ```typescript
   // ❌ BAD - Custom permission check with no RLS backing
   if (user.customPermission === 'special') {
     // Do something sensitive
   }
   ```

---

## Permission Audit Checklist

Use this checklist when adding new features:

### New Feature Development

- [ ] **Identify sensitive operations**
  - What data is being accessed/modified?
  - Who should have access?

- [ ] **Design RLS policies FIRST**
  - Define USING clause (read access)
  - Define WITH CHECK clause (write access)
  - Consider all roles (admin, owner, org_staff, etc.)

- [ ] **Implement RLS policies**
  - Create migration file
  - Add CREATE POLICY statements
  - Test with RLS test suite

- [ ] **Implement client-side checks**
  - Add hasPermission() checks to UI
  - Use PermissionGuard for components
  - Use ProtectedRoute for routes

- [ ] **Verify consistency**
  - Client permission constant matches RLS permission name
  - Client role constant matches RLS role name
  - Logic is equivalent (but client is UX, RLS is security)

- [ ] **Test attack scenarios**
  - Try bypassing client checks via console
  - Verify RLS blocks unauthorized access
  - Test with different user roles

### Code Review

When reviewing PRs that touch permissions:

- [ ] **Check for RLS policy**
  - Does migration include RLS policy?
  - Is policy logic correct?
  - Does policy cover all operations (SELECT/INSERT/UPDATE/DELETE)?

- [ ] **Check for client-side guard**
  - Are sensitive UI elements guarded?
  - Is logic consistent with RLS?
  - Are constants used (not hardcoded strings)?

- [ ] **Check for tests**
  - Are RLS tests included?
  - Do tests cover attack scenarios?
  - Do tests verify both grant and deny cases?

- [ ] **Check documentation**
  - Is security model documented?
  - Are edge cases explained?
  - Is there a clear owner for the feature?

---

## Common Pitfalls

### Pitfall 1: "UI hides the button, we're secure"

**Wrong:** Attackers don't use your UI.

**Right:** Always implement RLS, treat UI checks as bonus UX.

### Pitfall 2: "We check permissions in the API endpoint"

**Partially Right:** Good, but not enough if using Supabase client directly.

**Better:** Implement RLS policies so database enforces security regardless of which API accesses it.

### Pitfall 3: "Admin role gives access, no need for RLS"

**Wrong:** Admin role should be checked IN the RLS policy, not INSTEAD OF RLS.

**Right:**
```sql
USING (
  has_role(auth.uid(), 'admin') OR  -- Admin can access
  user_id = auth.uid()  -- Owner can access
)
```

### Pitfall 4: "Only we call this edge function, it's internal"

**Wrong:** Edge functions with service_role can be called by anyone who discovers the URL.

**Right:** Add authentication/authorization checks in edge function code.

---

## Migration Example

### Adding a New Protected Feature

Let's say we're adding a "Download User Data" feature:

#### Step 1: Define Permission Constant

```typescript
// src/shared/auth/permissions.ts

export const PERMISSIONS = {
  // ...existing permissions
  DOWNLOAD_USER_DATA: 'download_user_data',
} as const;
```

#### Step 2: Create RLS Policy

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_user_data_download_permission.sql

-- Create permission if not exists
INSERT INTO permissions (permission_name, description)
VALUES ('download_user_data', 'Can download user data exports')
ON CONFLICT (permission_name) DO NOTHING;

-- Grant permission to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.role_name = 'admin'
AND p.permission_name = 'download_user_data'
ON CONFLICT DO NOTHING;

-- Create RLS policy on user_data_exports table
CREATE POLICY "Users can download own data exports"
  ON public.user_data_exports
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin')
  );
```

#### Step 3: Implement UI Guard

```tsx
// src/components/settings/DataExportButton.tsx

import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS } from '@/shared/auth/permissions';

export function DataExportButton() {
  const { hasPermission } = useUserPermissions();

  // Client-side check (UX only)
  if (!hasPermission(PERMISSIONS.DOWNLOAD_USER_DATA)) {
    return null; // Hide button
  }

  return (
    <Button onClick={handleDownload}>
      Download My Data
    </Button>
  );
}
```

#### Step 4: Add Tests

```typescript
// supabase/functions/rls-tests/tests/user-data-exports.test.ts

export async function testUserDataExportsRLS(testData: TestData) {
  const results: TestResult[] = [];

  // Test: User can download own data export
  results.push(await runTest(
    'User can download own data export',
    async () => {
      const userClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      const { data } = await userClient
        .from('user_data_exports')
        .select('*')
        .eq('user_id', testData.userIds.USER_A);

      assertGranted(data || [], 'User should access own exports');
    }
  ));

  // Test: User cannot download other user's data export
  results.push(await runTest(
    'User cannot download other user data export',
    async () => {
      const userClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      const { data } = await userClient
        .from('user_data_exports')
        .select('*')
        .eq('user_id', testData.userIds.USER_B);

      assertDenied(data || [], 'User should not access other exports');
    }
  ));

  return results;
}
```

---

## Conclusion

The Force Majeure permission system has **two layers**:

1. **Client-Side (React):** For user experience, not security
2. **Server-Side (RLS):** For actual security enforcement

**Key Points:**

✅ **Always implement RLS policies** - This is the security boundary
✅ **Client checks are UX only** - Hide buttons, show loading states
✅ **Test with mock roles** - Verify UI behavior without switching accounts
✅ **Test with RLS suite** - Verify database enforces security
✅ **Document security model** - Make expectations clear

**Remember:** If it's not in an RLS policy, it's not secured. Client-side checks are a convenience for users, not a defense against attackers.

---

## Related Documentation

- [RLS_AUDIT_REPORT.md](./RLS_AUDIT_REPORT.md) - Comprehensive RLS audit
- [RLS_TEST_SUITE.md](./RLS_TEST_SUITE.md) - Automated testing framework
- [PERMISSION_MANAGEMENT_GUIDE.md](./PERMISSION_MANAGEMENT_GUIDE.md) - Role/permission usage guide
- [RLS_AND_GRANTS_GUIDE.md](../backend/RLS_AND_GRANTS_GUIDE.md) - Creating new tables with RLS
