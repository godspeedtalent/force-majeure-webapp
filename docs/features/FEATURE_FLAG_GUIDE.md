# Feature Flag Management Guide

## Overview

This guide covers the centralized feature flag system for the Force Majeure web application. The system provides type-safe, DRY feature flag management with minimal boilerplate.

## Architecture

### Core Components

1. **Feature Flag Constants** (`src/shared/config/featureFlags.ts`)
   - Central registry of all feature flags
   - Type definitions for type safety
   - Metadata with descriptions and categories

2. **Enhanced Hook** (`src/shared/hooks/useFeatureFlags.ts`)
   - `useFeatureFlags()` - Base hook for raw flag data
   - `useFeatureFlagHelpers()` - Enhanced hook with utility methods

3. **FeatureGuard Component** (`src/components/common/guards/FeatureGuard.tsx`)
   - Conditional rendering based on feature flags
   - Supports single or multiple flags
   - AND/OR logic with `requireAll` prop
   - Fallback component support

## Feature Flag Constants

All feature flags are defined in `src/shared/config/featureFlags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // Core Features
  DEMO_PAGES: 'demo_pages',

  // Event Features
  EVENT_CHECKOUT_TIMER: 'event_checkout_timer',

  // Scavenger Hunt
  SCAVENGER_HUNT: 'scavenger_hunt',
  SCAVENGER_HUNT_ACTIVE: 'scavenger_hunt_active',
  SHOW_LEADERBOARD: 'show_leaderboard',

  // User Features
  MEMBER_PROFILES: 'member_profiles',

  // Music & Media
  MUSIC_PLAYER: 'music_player',
  SPOTIFY_INTEGRATION: 'spotify_integration',

  // Commerce
  MERCH_STORE: 'merch_store',

  // Navigation
  GLOBAL_SEARCH: 'global_search',
} as const;

export const FEATURE_FLAG_METADATA = {
  [FEATURE_FLAGS.DEMO_PAGES]: {
    displayName: 'Demo Pages',
    description: 'Enables access to demo/testing pages',
    category: 'Core',
  },
  // ... more metadata
};
```

### Benefits of Constants

- **Type Safety**: TypeScript autocomplete and compile-time checking
- **Refactoring**: Find all usages with IDE tools
- **Documentation**: Single source of truth for feature names
- **Consistency**: Prevents typos and string duplication

## Usage Patterns

### 1. Conditional Rendering with FeatureGuard

The `FeatureGuard` component is the recommended approach for conditional UI rendering:

```tsx
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

// Simple single feature guard
<FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
  <MerchStoreLink />
</FeatureGuard>

// With fallback content
<FeatureGuard
  feature={FEATURE_FLAGS.MUSIC_PLAYER}
  fallback={<ComingSoonMessage />}
>
  <MusicPlayer />
</FeatureGuard>

// Multiple features - ANY enabled (OR logic)
<FeatureGuard feature={[FEATURE_FLAGS.MERCH_STORE, FEATURE_FLAGS.MUSIC_PLAYER]}>
  <MediaSection />
</FeatureGuard>

// Multiple features - ALL enabled (AND logic)
<FeatureGuard
  feature={[FEATURE_FLAGS.SPOTIFY_INTEGRATION, FEATURE_FLAGS.MUSIC_PLAYER]}
  requireAll={true}
>
  <SpotifyPlayer />
</FeatureGuard>

// Inverted logic - show when disabled
<FeatureGuard feature={FEATURE_FLAGS.DEMO_PAGES} invert={true}>
  <ProductionContent />
</FeatureGuard>
```

### 2. Programmatic Checks with useFeatureFlagHelpers

For logic that depends on feature flags, use the enhanced hook:

```tsx
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

function MyComponent() {
  const {
    isFeatureEnabled,
    isAnyFeatureEnabled,
    areAllFeaturesEnabled,
    getEnabledFeatures,
    isLoading,
  } = useFeatureFlagHelpers();

  // Simple check
  if (isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE)) {
    // Show merch-related content
  }

  // Check any of multiple features
  if (
    isAnyFeatureEnabled([FEATURE_FLAGS.MERCH_STORE, FEATURE_FLAGS.MUSIC_PLAYER])
  ) {
    // Show media section
  }

  // Check all features required
  if (
    areAllFeaturesEnabled([
      FEATURE_FLAGS.SPOTIFY_INTEGRATION,
      FEATURE_FLAGS.MUSIC_PLAYER,
    ])
  ) {
    // Show full Spotify player
  }

  // Get all enabled features
  const enabledFeatures = getEnabledFeatures();
  console.log('Enabled:', enabledFeatures);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }
}
```

### 3. Route Protection

Use `FeatureGuard` in routing logic:

```tsx
import { Navigate, Route } from 'react-router-dom';
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

// In App.tsx or routing configuration
<FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
  <Route path='/merch' element={<Merch />} />
</FeatureGuard>

// With redirect fallback
<FeatureGuard
  feature={FEATURE_FLAGS.MEMBER_PROFILES}
  fallback={<Navigate to="/" replace />}
>
  <Route path='/members/home' element={<MemberHome />} />
</FeatureGuard>
```

### 4. Navigation Items

Conditionally include navigation items:

```tsx
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';

function Navigation() {
  const { isFeatureEnabled } = useFeatureFlagHelpers();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
    // Conditional items
    ...(isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE)
      ? [{ label: 'Merch', path: '/merch' }]
      : []),
    ...(isFeatureEnabled(FEATURE_FLAGS.MEMBER_PROFILES)
      ? [{ label: 'Members', path: '/members' }]
      : []),
  ];

  return <nav>{/* render navItems */}</nav>;
}
```

Or use `FeatureGuard` for JSX elements:

```tsx
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

<nav>
  <NavLink to='/'>Home</NavLink>
  <FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
    <NavLink to='/merch'>Merch</NavLink>
  </FeatureGuard>
  <FeatureGuard feature={FEATURE_FLAGS.MEMBER_PROFILES}>
    <NavLink to='/members'>Members</NavLink>
  </FeatureGuard>
</nav>;
```

## Migration Examples

### Before (Anti-pattern)

```tsx
// ❌ Hard-coded strings, no type safety, verbose
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

function MyComponent() {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) return <Loader />;

  return (
    <div>
      {flags?.merch_store && <MerchLink />}
      {flags?.music_player && <MusicPlayer />}
      {flags?.demo_pages ? <DemoContent /> : <MainApp />}
    </div>
  );
}
```

### After (Recommended)

```tsx
// ✅ Type-safe constants, cleaner, DRY
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

function MyComponent() {
  return (
    <div>
      <FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
        <MerchLink />
      </FeatureGuard>

      <FeatureGuard feature={FEATURE_FLAGS.MUSIC_PLAYER}>
        <MusicPlayer />
      </FeatureGuard>

      <FeatureGuard
        feature={FEATURE_FLAGS.DEMO_PAGES}
        fallback={<MainApp />}
      >
        <DemoContent />
      </FeatureGuard>
    </div>
  );
}
```

## Complex Scenarios

### Feature Dependencies

When Feature B requires Feature A:

```tsx
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

// Spotify player requires both flags enabled
<FeatureGuard
  feature={[FEATURE_FLAGS.MUSIC_PLAYER, FEATURE_FLAGS.SPOTIFY_INTEGRATION]}
  requireAll={true}
>
  <SpotifyPlayer />
</FeatureGuard>;
```

### Conditional Feature Activation

Enable features based on other conditions:

```tsx
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { useUserPermissions } from '@/shared/hooks/useUserRole';

function AdminFeature() {
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const { hasRole } = useUserPermissions();
  const { ROLES } = '@/shared/auth/permissions';

  // Feature only available to admins when flag is enabled
  if (!isFeatureEnabled(FEATURE_FLAGS.DEMO_PAGES) || !hasRole(ROLES.ADMIN)) {
    return null;
  }

  return <AdminDemoPanel />;
}
```

### Dynamic Feature Loading

Load features asynchronously:

```tsx
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { lazy, Suspense } from 'react';

// Lazy-load heavy features only when enabled
const SpotifyPlayer = lazy(() => import('@/components/SpotifyPlayer'));

function MediaSection() {
  const { isFeatureEnabled, isLoading } = useFeatureFlagHelpers();

  if (isLoading) return <LoadingSpinner />;

  if (!isFeatureEnabled(FEATURE_FLAGS.SPOTIFY_INTEGRATION)) {
    return <BasicPlayer />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SpotifyPlayer />
    </Suspense>
  );
}
```

## Best Practices

### 1. Always Use Constants

❌ **Don't:**

```tsx
const enabled = flags?.merch_store;
if (flags?.demo_pages) {
}
```

✅ **Do:**

```tsx
const enabled = isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE);
if (isFeatureEnabled(FEATURE_FLAGS.DEMO_PAGES)) {
}
```

### 2. Use FeatureGuard for UI

❌ **Don't:**

```tsx
{
  flags?.merch_store && <MerchButton />;
}
{
  flags?.music_player ? <Player /> : null;
}
```

✅ **Do:**

```tsx
<FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
  <MerchButton />
</FeatureGuard>

<FeatureGuard feature={FEATURE_FLAGS.MUSIC_PLAYER}>
  <Player />
</FeatureGuard>
```

### 3. Handle Loading States

Always handle the loading state:

```tsx
const { isFeatureEnabled, isLoading } = useFeatureFlagHelpers();

if (isLoading) {
  return <Skeleton />;
}

// Now safe to check features
```

`FeatureGuard` handles loading automatically.

### 4. Combine with Permission Checks

Feature flags and permissions work together:

```tsx
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { PERMISSIONS } from '@/shared/auth/permissions';

// Feature must be enabled AND user must have permission
<FeatureGuard feature={FEATURE_FLAGS.DEMO_PAGES}>
  <PermissionGuard permission={PERMISSIONS.VIEW_ADMIN_PANEL}>
    <AdminDemo />
  </PermissionGuard>
</FeatureGuard>;
```

### 5. Document Feature Purpose

Always add metadata for new features:

```typescript
export const FEATURE_FLAG_METADATA = {
  [FEATURE_FLAGS.YOUR_NEW_FEATURE]: {
    displayName: 'Human Readable Name',
    description: 'Clear description of what this feature does',
    category: 'Appropriate Category',
  },
};
```

## Database Management

Feature flags are stored in the `feature_flags` table in Supabase:

```sql
-- Check current flags
SELECT * FROM feature_flags;

-- Enable a feature
UPDATE feature_flags
SET enabled = true
WHERE flag_name = 'merch_store';

-- Disable a feature
UPDATE feature_flags
SET enabled = false
WHERE flag_name = 'demo_pages';
```

## Testing

### Unit Tests

```tsx
import { render } from '@testing-library/react';
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

// Mock the feature flags hook
jest.mock('@/shared/hooks/useFeatureFlags', () => ({
  useFeatureFlagHelpers: () => ({
    isFeatureEnabled: (flag: string) => flag === FEATURE_FLAGS.MERCH_STORE,
    isLoading: false,
  }),
}));

test('renders when feature enabled', () => {
  const { getByText } = render(
    <FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
      <div>Merch Content</div>
    </FeatureGuard>
  );

  expect(getByText('Merch Content')).toBeInTheDocument();
});
```

## Troubleshooting

### Flag Not Working

1. Check database: Verify flag exists and is enabled in `feature_flags` table
2. Check constant: Ensure `FEATURE_FLAGS` constant matches database `flag_name`
3. Check loading: Ensure you're handling the loading state
4. Clear cache: React Query may have cached old flag values

### TypeScript Errors

If you get type errors with FEATURE_FLAGS:

- Ensure you're importing from `@/shared/config/featureFlags`
- Check that the constant name matches what's exported
- Verify TypeScript can resolve the path alias

## API Reference

### FeatureGuard Props

```typescript
interface FeatureGuardProps {
  children: React.ReactNode;
  feature: string | string[]; // Single flag or array of flags
  requireAll?: boolean; // For arrays: AND logic (default: false = OR)
  fallback?: React.ReactNode; // Shown when feature disabled
  invert?: boolean; // Reverse logic (show when disabled)
}
```

### useFeatureFlagHelpers Return

```typescript
interface FeatureFlagHelpers {
  isFeatureEnabled: (flag: string) => boolean;
  isAnyFeatureEnabled: (flags: string[]) => boolean;
  areAllFeaturesEnabled: (flags: string[]) => boolean;
  getEnabledFeatures: () => string[];
  isLoading: boolean;
  data: FeatureFlagsState | undefined;
}
```

## Related Documentation

- [Permission Management Guide](./PERMISSION_MANAGEMENT_GUIDE.md) - Role and permission system
- [Role Permission Quick Reference](./ROLE_PERMISSION_QUICK_REFERENCE.md) - Permission patterns

## Summary

The feature flag system provides:

- ✅ Type-safe feature flag management
- ✅ Centralized constants with metadata
- ✅ Clean, declarative UI guards
- ✅ Flexible programmatic checks
- ✅ Minimal boilerplate
- ✅ Consistent patterns across codebase

Use `FeatureGuard` for UI, `useFeatureFlagHelpers` for logic, and always use `FEATURE_FLAGS` constants.
