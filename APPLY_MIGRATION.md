# Apply User Profile Trigger Migration

## Problem
When users sign up, Supabase creates a user in `auth.users` but doesn't automatically create a profile in the `profiles` table. This causes a 500 error because the application expects a profile to exist.

## Solution
Apply the migration file `supabase/migrations/20251102000000_add_user_profile_trigger.sql` to your database.

## Steps to Apply

### Option 1: Using Supabase Dashboard (SQL Editor)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Copy and paste the following SQL:

```sql
-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create a trigger to automatically create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile record when a new user signs up via Supabase Auth';
```

5. Click "Run" to execute the SQL

### Option 2: Using Supabase CLI (if database password is configured)

```bash
npx supabase db push
```

## Verification

After applying the migration, test by:
1. Creating a new user account through the signup form
2. Check that the signup completes without a 500 error
3. Verify that a profile record was created in the `profiles` table

## What This Does

- Creates a `handle_new_user()` function that automatically inserts a profile record when a user signs up
- Sets up a trigger `on_auth_user_created` that fires after a new user is inserted into `auth.users`
- Extracts the `display_name` from the user metadata (if provided during signup) and stores it in the profile
