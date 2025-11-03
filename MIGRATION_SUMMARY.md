# Migration Summary - Profile & Auth Updates

## Overview
This document summarizes all changes made to implement the new profile system, fix signup issues, and add Spotify feature flagging.

## Changes Made

### 1. Breadcrumb Separator
**File**: [src/components/navigation/Navigation.tsx:34](src/components/navigation/Navigation.tsx#L34)

Added a `>` separator between the Force Majeure logo and breadcrumbs for better visual hierarchy.

### 2. Spotify Integration Feature Flag
**Files Modified**:
- [src/shared/hooks/useFeatureFlags.ts](src/shared/hooks/useFeatureFlags.ts) - Added `spotify_integration` flag
- [src/pages/ProfileEdit.tsx](src/pages/ProfileEdit.tsx) - Wrapped Spotify section in feature flag check

**Migration File Created**:
- [supabase/migrations/20251102000001_add_spotify_integration_flag.sql](supabase/migrations/20251102000001_add_spotify_integration_flag.sql)

The Spotify integration is now hidden behind a feature flag that is disabled by default in both dev and production environments.

### 3. Fixed Duplicate Email Issue on Signup
**Files Modified**:
- [supabase/migrations/20251102000000_add_user_profile_trigger.sql](supabase/migrations/20251102000000_add_user_profile_trigger.sql) - Added `ON CONFLICT DO NOTHING` to prevent duplicate profile creation
- [src/features/auth/services/AuthContext.tsx:176-200](src/features/auth/services/AuthContext.tsx#L176-L200) - Added better error logging

The trigger now handles duplicate user_id conflicts gracefully, which should prevent the duplicate email confirmation issue.

### 4. Created FmCommonUserPhoto Component
**New File**: [src/components/ui/display/FmCommonUserPhoto.tsx](src/components/ui/display/FmCommonUserPhoto.tsx)

A reusable user avatar component with:
- Support for avatar images
- Fallback to user initials
- Fallback to User icon if no name
- Multiple size variants (xs, sm, md, lg, xl, 2xl)
- Optional border ring
- Consistent gold gradient styling for fallbacks

### 5. New Public Profile Page
**Files**:
- **Created**: [src/pages/Profile.tsx](src/pages/Profile.tsx) - New public-facing profile view
- **Renamed**: Old Profile.tsx → [src/pages/ProfileEdit.tsx](src/pages/ProfileEdit.tsx) - Settings/edit page
- **Updated**: [src/App.tsx](src/App.tsx) - Added routes for both pages

**New Profile Page Features**:
- Clean single-column layout using `Layout` component
- Public-facing with minimal information
- Uses FmCommonUserPhoto for avatar display
- Shows:
  - User avatar with initials fallback
  - Display name (or "Raver" as fallback)
  - Email address
  - Member since date
  - Edit Profile button linking to `/profile/edit`

**ProfileEdit Page Updates**:
- Converted from SplitPageLayout to single-column Layout
- Uses FmCommonPageHeader and Card components
- Spotify integration section only shows if `spotify_integration` feature flag is enabled
- Back button navigates to public profile page

## Database Migrations Required

### Apply These SQL Statements in Supabase Dashboard

#### 1. User Profile Trigger (Priority: HIGH - Fixes signup)
```sql
-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if it doesn't already exist
  INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

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

#### 2. Spotify Integration Feature Flag (Priority: MEDIUM)
```sql
-- Add spotify_integration feature flag (disabled by default)
INSERT INTO public.feature_flags (flag_name, is_enabled, description, environment, disabled)
VALUES
  ('spotify_integration', false, 'Enable Spotify integration and authentication features', 'dev', false),
  ('spotify_integration', false, 'Enable Spotify integration and authentication features', 'prod', false)
ON CONFLICT (flag_name, environment) DO NOTHING;
```

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/profile` | Profile.tsx | Public profile view |
| `/profile/edit` | ProfileEdit.tsx | Profile settings & editing |

## Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| FmCommonUserPhoto | `src/components/ui/display/FmCommonUserPhoto.tsx` | Reusable avatar component |

## Testing Checklist

- [ ] Apply database migrations in Supabase dashboard
- [ ] Test new user signup (should not get 500 error)
- [ ] Test new user signup (should only receive ONE confirmation email)
- [ ] Navigate to `/profile` when logged in
- [ ] Click "Edit Profile" button to navigate to `/profile/edit`
- [ ] Verify Spotify section is NOT visible on `/profile/edit` (feature flag disabled)
- [ ] Test updating display name on edit page
- [ ] Verify breadcrumb separator appears between logo and breadcrumbs

## Notes

- The `spotify_integration` feature flag is **disabled by default** in both environments
- The new Profile page is **public-facing** and shows minimal information
- The ProfileEdit page is for **account settings and management**
- All changes use existing FmCommon components for consistency
- The user trigger prevents profile creation errors during signup
