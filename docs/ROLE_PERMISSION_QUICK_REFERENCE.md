# Role & Permission System - Quick Reference

## For Developers

### Import the Hook

```typescript
import { useUserPermissions } from '@/shared/hooks';
```

### Check Permissions

```typescript
const { hasPermission, hasRole, roles } = useUserPermissions();

// Check if user has a specific permission
if (hasPermission('manage_events')) {
  // Show event management UI
}

// Check if user has a specific role
if (hasRole('admin')) {
  // Show admin controls
}

// Access all roles
roles?.forEach(role => {
  console.log(role.role_name);
  console.log(role.display_name);
  console.log(role.permission_names);
});
```

### Common Patterns

#### Protecting Routes

```typescript
const { hasPermission } = useUserPermissions();
const navigate = useNavigate();

useEffect(() => {
  if (!hasPermission('manage_organization')) {
    navigate('/');
  }
}, [hasPermission, navigate]);
```

#### Conditional UI Rendering

```typescript
const { hasPermission } = useUserPermissions();

return (
  <div>
    {hasPermission('manage_events') && (
      <Button onClick={createEvent}>Create Event</Button>
    )}
  </div>
);
```

#### Multiple Permission Checks

```typescript
const { hasPermission } = useUserPermissions();

const canManageOrg = hasPermission('manage_organization');
const canViewOrg = hasPermission('view_organization');
const hasOrgAccess = canManageOrg || canViewOrg;
```

## Available Permissions

| Permission            | Description                   | Default Roles                          |
| --------------------- | ----------------------------- | -------------------------------------- |
| `*`                   | Full system access (wildcard) | admin, developer                       |
| `debug_mode`          | Access to debug tools         | developer                              |
| `view_events`         | View event listings           | user, admin, developer                 |
| `purchase_tickets`    | Buy tickets to events         | user, admin, developer                 |
| `manage_organization` | Full organization management  | org_admin, admin, developer            |
| `manage_events`       | Create and edit events        | org_admin, admin, developer            |
| `view_analytics`      | Access analytics dashboard    | org_admin, admin, developer            |
| `manage_staff`        | Add and remove staff members  | org_admin, admin, developer            |
| `view_organization`   | View organization details     | org_staff, org_admin, admin, developer |
| `check_in_guests`     | Check guests into events      | org_staff, org_admin, admin, developer |
| `scan_tickets`        | Scan and validate tickets     | org_staff, org_admin, admin, developer |
| `manage_own_profile`  | Edit own user profile         | user, admin, developer                 |

## Default Roles

| Role        | Display Name       | Description                    | Key Permissions                                                  |
| ----------- | ------------------ | ------------------------------ | ---------------------------------------------------------------- |
| `user`      | User               | Standard user                  | view_events, purchase_tickets, manage_own_profile                |
| `admin`     | Administrator      | Full system administrator      | \* (all)                                                         |
| `developer` | Developer          | Developer access for testing   | \*, debug_mode                                                   |
| `org_admin` | Organization Admin | Manage organization and events | manage_organization, manage_events, view_analytics, manage_staff |
| `org_staff` | Organization Staff | Check-in and scan tickets      | view_organization, check_in_guests, scan_tickets                 |

## Database Functions

### Get User Roles

```sql
SELECT * FROM get_user_roles('user-uuid-here');
```

Returns:

```json
[
  {
    "role_name": "admin",
    "display_name": "Administrator",
    "permission_names": ["*"]
  }
]
```

### Check Permission

```sql
SELECT has_permission('user-uuid-here', 'manage_events');
```

Returns: `true` or `false`

### Check Role

```sql
SELECT has_role('user-uuid-here', 'admin');
```

Returns: `true` or `false`

## Adding New Permissions

1. Insert into `permissions` table:

```sql
INSERT INTO public.permissions (name, display_name, description, category)
VALUES ('new_permission', 'New Permission', 'Description here', 'category');
```

2. Assign to roles:

```sql
UPDATE public.roles
SET permission_ids = array_append(permission_ids,
  (SELECT id FROM public.permissions WHERE name = 'new_permission')
)
WHERE name = 'role_name';
```

## Adding New Roles

```sql
INSERT INTO public.roles (name, display_name, description, is_system_role, permission_ids)
SELECT
  'new_role',
  'New Role Display Name',
  'Description of the role',
  false, -- not a system role
  ARRAY(
    SELECT id FROM public.permissions
    WHERE name IN ('permission1', 'permission2')
  );
```

## Assigning Roles to Users

```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT
  'user-uuid-here',
  (SELECT id FROM public.roles WHERE name = 'role_name')
ON CONFLICT (user_id, role_id) DO NOTHING;
```

## Migration from Old System

### Old Code ❌

```typescript
const { data: role } = useUserRole();
if (role === 'admin') {
  // do something
}
```

### New Code ✅

```typescript
const { hasRole } = useUserPermissions();
if (hasRole('admin')) {
  // do something
}
```

### Permission-Based (Better) ✨

```typescript
const { hasPermission } = useUserPermissions();
if (hasPermission('manage_events')) {
  // do something
}
```

## Edge Function Usage

```typescript
// Check if user is admin
const { data: userRoles } = await supabaseClient.rpc('get_user_roles', {
  user_id_param: user.id,
});

const isAdmin = userRoles?.some(
  (r: any) => r.role_name === 'admin' || r.permission_names.includes('*')
);
```

## Best Practices

1. **Prefer permission checks over role checks** when possible
   - More flexible and maintainable
   - Easier to adjust access without changing code

2. **Use semantic permission names**
   - `hasPermission('manage_events')` is clearer than `hasRole('org_admin')`

3. **Always check for wildcard (`*`) permission**
   - Admin and developer roles have full access

4. **Handle loading states**

   ```typescript
   const { hasPermission, roles } = useUserPermissions();
   if (!roles) return <Loading />;
   ```

5. **Don't hardcode role names in logic**
   - Use permissions instead for better flexibility

## Troubleshooting

### Permission not working?

- Check if role has the permission: `SELECT * FROM get_user_roles('user-uuid')`
- Verify permission exists: `SELECT * FROM permissions WHERE name = 'permission_name'`
- Check wildcard: Users with `*` permission have access to everything

### Role not appearing?

- Verify role assignment: `SELECT * FROM user_roles WHERE user_id = 'user-uuid'`
- Check role definition: `SELECT * FROM roles WHERE name = 'role_name'`

### RPC function errors?

- Ensure functions are created: `\df get_user_roles` in psql
- Check function permissions: Functions should be `SECURITY DEFINER`
