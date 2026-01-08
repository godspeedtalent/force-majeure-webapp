# Session-Based Feature Flag Overrides

## Overview

Session-based feature flag overrides allow developers and admins to temporarily override feature flag values for their current browser session only. This is particularly useful for:

- Testing features without modifying database values
- Debugging feature-specific issues
- Demoing features to stakeholders without affecting other users

## How It Works

Session overrides are stored in the browser's `sessionStorage` and:
- **Only affect the current browser tab**
- **Override both database values and .env settings**
- **Are automatically cleared when the tab is closed**
- **Do not persist across page reloads** (but remain active within the same session)
- **Only available to users with ADMIN or DEVELOPER roles**

### Priority Order

Feature flags are resolved in the following priority order (highest to lowest):

1. **Session Override** (sessionStorage)
2. **Environment Override** (.env files) - Development only
3. **Database Value** (feature_flags table)

## Usage

### Via Developer Toolbar

1. Open the FmToolbar (floating tabs on the right side)
2. Click on the "Session Overrides" tab (Settings2 icon)
3. Toggle any feature flag override on or off
4. The override is applied immediately

### Programmatically

```typescript
import {
  setFeatureFlagOverride,
  getFeatureFlagOverride,
  clearFeatureFlagOverride,
  clearAllFeatureFlagOverrides,
  hasFeatureFlagOverride,
} from '@/shared/utils/featureFlagOverrides';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

// Set an override
setFeatureFlagOverride(FEATURE_FLAGS.DEMO_PAGES, false);

// Get current override value (returns null if not set)
const override = getFeatureFlagOverride(FEATURE_FLAGS.DEMO_PAGES);

// Check if override exists
const hasOverride = hasFeatureFlagOverride(FEATURE_FLAGS.DEMO_PAGES);

// Clear specific override
clearFeatureFlagOverride(FEATURE_FLAGS.DEMO_PAGES);

// Clear all overrides
clearAllFeatureFlagOverrides();
```

## Implementation Details

### Files Created/Modified

#### Key Files
- [`src/shared/utils/featureFlagOverrides.ts`](../../src/shared/utils/featureFlagOverrides.ts) - Utility functions for managing session overrides
- [`src/components/common/toolbar/tabs/SessionOverridesTab.tsx`](../../src/components/common/toolbar/tabs/SessionOverridesTab.tsx) - UI for session overrides in dev toolbar
- [`src/shared/hooks/useFeatureFlags.ts`](../../src/shared/hooks/useFeatureFlags.ts) - Updated to check session overrides
- [`src/components/common/toolbar/FmToolbar.tsx`](../../src/components/common/toolbar/FmToolbar.tsx) - Contains Session Overrides tab

### Architecture

```
┌─────────────────────────────────────────────┐
│ User requests feature flag value           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ useFeatureFlags hook                        │
│ 1. Fetch from database                      │
│ 2. Apply .env overrides (dev only)          │
│ 3. Apply session overrides                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Return final flag value                     │
└─────────────────────────────────────────────┘
```

## Examples

### Example 1: Testing a Feature

**Scenario**: A feature flag is disabled in production, but you need to test the feature.

**Solution**:
1. Open dev toolbar → Session Overrides
2. Toggle the feature flag to ON (enabled)
3. You can now access the feature
4. Close the tab when done (clears override automatically)

### Example 2: Demoing to Stakeholders

**Scenario**: You want to show stakeholders a feature that is still behind a feature flag.

**Solution**:
1. Share your screen
2. Enable session override for the feature
3. Navigate through the app normally
4. When done, stakeholders still see the normal version on their devices

## Security Considerations

- Session overrides are **client-side only** and do not affect the database
- Overrides require **ADMIN or DEVELOPER role** to access the UI
- Overrides are stored in **sessionStorage** (not localStorage), so they're automatically cleared when the tab closes
- The feature flag query cache is invalidated when overrides are changed, ensuring consistency

## Future Enhancements

Potential improvements for this system:

1. Add more feature flags to the Session Overrides UI
2. Persist overrides across page reloads (but still clear on tab close)
3. Add a visual indicator when session overrides are active
4. Add override history/logging for debugging

## Related Documentation

- [Feature Flag Guide](./FEATURE_FLAG_GUIDE.md) - Complete feature flag system documentation
- [Environment System](../backend/ENVIRONMENT_SYSTEM.md) - Environment-based configuration
- [Developer Tools](../architecture/DEVELOPER_TOOLS.md) - FmToolbar and dev features
