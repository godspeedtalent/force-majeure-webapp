# Feature Flags System

This project uses a hybrid environment-based feature flag system that combines database-driven flags with local development overrides.

## How It Works

### Database Flags

Feature flags are stored in the `feature_flags` table with the following structure:

- `flag_name`: The name of the feature flag
- `is_enabled`: Whether the flag is enabled
- `environment`: Which environment(s) this flag applies to: `'dev'`, `'prod'`, or `'all'`

### Environment Detection

The system automatically detects the current environment using Vite's `import.meta.env.MODE`:

- **Development**: `localhost`, preview deployments, and non-production URLs
- **Production**: Your production domain

### Local Overrides (Development Only)

In development mode, you can override any feature flag using environment variables in your `.env` file:

```env
# Override format: VITE_FF_<FLAG_NAME_UPPERCASE>=true|false
VITE_FF_SCAVENGER_HUNT_ACTIVE=true
VITE_FF_COMING_SOON_MODE=false
VITE_FF_SHOW_LEADERBOARD=true
```

**Important**: Local overrides only work in development mode for safety. Production always uses database values.

## Available Flags

Currently implemented feature flags:

1. **scavenger_hunt_active**: Controls whether the scavenger hunt feature is available
2. **coming_soon_mode**: Enables/disables coming soon mode for the site
3. **show_leaderboard**: Controls leaderboard visibility

## Usage in Code

### Basic Usage

```tsx
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

function MyComponent() {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) return <Loader />;

  return (
    <div>
      {flags?.scavenger_hunt_active && <ScavengerHunt />}
      {flags?.show_leaderboard && <Leaderboard />}
    </div>
  );
}
```

### Using FeatureFlagGuard

Protect entire routes or components:

```tsx
import { FeatureFlagGuard } from '@/components/FeatureFlagGuard';

function App() {
  return (
    <FeatureFlagGuard
      flagName="scavenger_hunt_active"
      redirectTo="/"
    >
      <ScavengerPage />
    </FeatureFlagGuard>
  );
}

// Inverted logic (show when flag is false)
<FeatureFlagGuard
  flagName="coming_soon_mode"
  redirectTo="/coming-soon"
  invert
>
  <MainApp />
</FeatureFlagGuard>
```

## Managing Flags

### Via Supabase Dashboard

1. Go to your Supabase project
2. Navigate to the Table Editor
3. Open the `feature_flags` table
4. Edit the `is_enabled` and `environment` columns

### Via SQL

```sql
-- Enable a flag for production only
UPDATE feature_flags
SET is_enabled = true, environment = 'prod'
WHERE flag_name = 'scavenger_hunt_active';

-- Enable a flag for all environments
UPDATE feature_flags
SET is_enabled = true, environment = 'all'
WHERE flag_name = 'show_leaderboard';

-- Enable for development only
UPDATE feature_flags
SET is_enabled = true, environment = 'dev'
WHERE flag_name = 'coming_soon_mode';
```

## Best Practices

### Flag Naming

- Use snake_case: `my_feature_flag`
- Be descriptive: `enable_checkout` not `checkout`
- Use positive names: `show_leaderboard` not `hide_leaderboard`

### Environment Scoping

- **`'all'`**: Use for flags that should work the same everywhere (most common)
- **`'prod'`**: Use for features only ready for production
- **`'dev'`**: Use for features being tested or developed

### Development Workflow

1. **Testing Production Behavior Locally**:
   ```env
   # .env
   VITE_FF_COMING_SOON_MODE=true  # Override to test production state
   ```

2. **Testing New Features**:
   - Create flag with `environment = 'dev'` and `is_enabled = true`
   - Test locally
   - When ready, update to `environment = 'all'` or `'prod'`

3. **Releasing Features**:
   - Keep flag disabled in production (`environment = 'prod'`, `is_enabled = false`)
   - Test in development
   - Enable in production when ready (no deployment needed!)

### Adding New Flags

1. **Add to database**:
   ```sql
   INSERT INTO feature_flags (flag_name, is_enabled, environment, description)
   VALUES ('my_new_feature', false, 'all', 'Description of the feature');
   ```

2. **Update TypeScript interface** in `src/shared/hooks/useFeatureFlags.ts`:
   ```ts
   interface FeatureFlags {
     scavenger_hunt_active: boolean;
     coming_soon_mode: boolean;
     show_leaderboard: boolean;
     my_new_feature: boolean; // Add here
   }
   ```

3. **Update the hook** to include the new flag:
   ```ts
   data?.forEach(flag => {
     // ... existing flags
     if (flag.flag_name === 'my_new_feature') {
       flags.my_new_feature = flag.is_enabled;
     }
   });
   ```

4. **Use in code**:
   ```tsx
   const { data: flags } = useFeatureFlags();
   
   {flags?.my_new_feature && <MyNewFeature />}
   ```

## Debugging

The feature flags system logs its state to the console:

```
🚩 Feature flags loaded: {
  environment: 'dev',
  dbFlags: [...],
  finalFlags: { ... },
  isDev: true
}
```

Check the console to see:
- Which environment is detected
- What flags were loaded from the database
- What the final flag values are after overrides
- Whether local overrides are being applied

## Environment Variables Reference

### Automatic Detection
- `MODE`: Set by Vite (`'development'` or `'production'`)

### Feature Flag Overrides (Development Only)
- `VITE_FF_SCAVENGER_HUNT_ACTIVE`: Override scavenger hunt flag
- `VITE_FF_COMING_SOON_MODE`: Override coming soon mode
- `VITE_FF_SHOW_LEADERBOARD`: Override leaderboard visibility

## Migration Reference

The feature flags table was created with:

```sql
CREATE TABLE feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'all' CHECK (environment IN ('dev', 'prod', 'all')),
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_environment ON feature_flags(environment);
```
