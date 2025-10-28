# Admin Guide - Force Majeure Platform

## User Role Management

This platform uses a role-based access control (RBAC) system to restrict administrative functions. Only users with the `admin` role can modify feature flags and other administrative settings.

### Adding an Admin User

To grant admin privileges to a user, you need to insert a record into the `user_roles` table using the Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Run the following query (replace `USER_ID_HERE` with the actual user ID):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin');
```

**To find a user's ID:**

1. Go to Supabase Dashboard → Authentication → Users
2. Click on the user to see their details
3. Copy the UUID from the "User UID" field

### Removing Admin Access

To revoke admin privileges:

```sql
DELETE FROM public.user_roles
WHERE user_id = 'USER_ID_HERE' AND role = 'admin';
```

## Feature Flag Management

Feature flags control which features are enabled on the platform. Only admins can modify these flags.

### Current Feature Flags

- `coming_soon_mode` - When enabled, shows a "Coming Soon" page instead of the full app

### Updating Feature Flags (Admin Only)

To toggle a feature flag, use the Supabase SQL Editor:

```sql
-- Enable a feature
UPDATE public.feature_flags
SET is_enabled = true
WHERE flag_name = 'coming_soon_mode';

-- Disable a feature
UPDATE public.feature_flags
SET is_enabled = false
WHERE flag_name = 'coming_soon_mode';
```

**Note:** Only users with the `admin` role can execute these UPDATE queries. Regular users will receive a permission denied error.

### Adding New Feature Flags

To add a new feature flag:

```sql
INSERT INTO public.feature_flags (flag_name, is_enabled, description)
VALUES ('new_feature_name', false, 'Description of what this flag controls');
```

## Security Notes

- **Never modify the `user_roles` table from the client-side** - all role changes must be done through the Supabase SQL Editor or secure backend functions
- The `has_role()` function is a security definer function that safely checks user permissions without exposing role data
- Feature flag updates from non-admin users will fail silently with RLS policy violations
- Keep your admin user list minimal - only grant admin access to trusted users

## Troubleshooting

### "Permission denied" errors when updating feature flags

- Verify the user has an `admin` role in the `user_roles` table
- Check that the user is authenticated (has a valid session)
- Ensure the RLS policies are correctly applied to the `feature_flags` table

### User can't see their role

- Users can view their own roles via the SELECT policy on `user_roles`
- Query: `SELECT * FROM user_roles WHERE user_id = auth.uid()`
