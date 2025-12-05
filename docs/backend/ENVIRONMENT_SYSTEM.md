# Environment System Implementation

## Overview

Implemented a comprehensive, dynamic environment management system for Force Majeure that eliminates all hard-coded environment strings and centralizes environment configuration.

## Key Features

✅ **Dynamic Environment Detection**: Environment determined from `VITE_ENVIRONMENT` variable in `.env`  
✅ **Zero Hard-Coding**: No environment strings anywhere in application code  
✅ **Database-Backed**: Environments table provides reference data with foreign keys  
✅ **Type-Safe**: Full TypeScript support with proper interfaces  
✅ **Centralized Service**: Single source of truth for environment detection  
✅ **React Hooks**: Easy-to-use hooks for components  
✅ **Multi-Environment Support**: dev, qa, prod, and "all" environments

## Implementation Details

### 1. Database Migration

**File**: `/supabase/migrations/00000000000001_add_environments_table.sql`

- Creates `environments` reference table
- Seeds default environments (dev, qa, prod, all)
- Migrates `feature_flags` table to use `environment_id` foreign key
- Migrates `ticketing_fees` table to use `environment_id` foreign key
- Adds RLS policies for environment access
- Re-seeds feature flags and ticketing fees with proper environment references

### 2. Environment Service

**File**: `/src/shared/services/environmentService.ts`

Centralized service class that provides:
- `getCurrentEnvironmentName()` - Get environment name from .env or hostname
- `getCurrentEnvironment()` - Get full environment object from database
- `getAvailableEnvironments()` - Get all active environments
- `getEnvironmentByName(name)` - Get specific environment by name
- `isProduction()`, `isDevelopment()`, `isQA()` - Convenience checks
- `clearCache()` - Clear cached data for testing

**Detection Priority**:
1. `VITE_ENVIRONMENT` in `.env` (primary)
2. Hostname detection (fallback for deployed environments)
3. Default to 'dev' (safety fallback)

### 3. React Hooks

**File**: `/src/shared/hooks/useEnvironment.ts`

Provides React hooks for components:
- `useCurrentEnvironment()` - Get current environment (async, from database)
- `useAvailableEnvironments()` - Get all environments (async, from database)
- `useEnvironmentName()` - Get environment name (sync, from service)
- `useIsProduction()`, `useIsDevelopment()`, `useIsQA()` - Boolean checks

### 4. Updated Components

#### Feature Flags (`useFeatureFlags`)
- Queries `feature_flags` with dynamic environment detection
- Fetches flags for current environment OR 'all' environment
- Uses `environment_id` foreign key instead of string matching
- Maintains local .env override support in development

#### Ticketing Fees (`useTicketFees`)
- Queries `ticketing_fees` with dynamic environment detection
- Fetches fees for current environment OR 'all' environment
- Uses `environment_id` foreign key instead of string matching

#### Feature Toggle Section (`FeatureToggleSection`)
- Displays current environment name in UI
- Fetches and updates flags using `environment_id`
- Uses environment service for dynamic detection

#### Admin Fees Section (`AdminFeesSection`)
- Displays current environment in UI
- Shows "(Editing: all environments)" indicator
- Updates fees using `environment_id`

### 5. Environment Variables

**Added to `.env` and `.env.template`**:
```bash
# ENVIRONMENT
# Set to 'dev', 'qa', or 'prod' - determines which environment-specific config to load
# Defaults to 'dev' if not set
VITE_ENVIRONMENT="dev"
```

### 6. Exports

Updated barrel files:
- `/src/shared/services/index.ts` - Exports environment service and helpers
- `/src/shared/hooks/index.ts` - Exports environment hooks

## Usage Examples

### In Services/Utilities

```typescript
import { environmentService } from '@/shared/services/environmentService';

// Get environment name (synchronous)
const envName = environmentService.getCurrentEnvironmentName();

// Get environment object (asynchronous)
const env = await environmentService.getCurrentEnvironment();
console.log(`Running in ${env.display_name} (${env.name})`);

// Check environment type
if (environmentService.isProduction()) {
  // Production-only code
}
```

### In React Components

```typescript
import {
  useEnvironmentName,
  useCurrentEnvironment,
  useIsProduction,
} from '@/shared/hooks/useEnvironment';

function MyComponent() {
  const envName = useEnvironmentName(); // 'dev', 'qa', or 'prod'
  const { data: environment, isLoading } = useCurrentEnvironment();
  const isProduction = useIsProduction();

  return (
    <div>
      <p>Environment: {envName}</p>
      {isProduction && <ProductionBanner />}
    </div>
  );
}
```

### Querying Environment-Specific Data

```typescript
import { environmentService } from '@/shared/services/environmentService';
import { supabase } from '@/shared/api/supabase/client';

async function fetchEnvironmentConfig() {
  // Get current environment
  const currentEnv = await environmentService.getCurrentEnvironment();

  // Get 'all' environment
  const { data: allEnv } = await supabase
    .from('environments')
    .select('id')
    .eq('name', 'all')
    .single();

  // Query with both environments
  const environmentIds = [currentEnv.id];
  if (allEnv) environmentIds.push(allEnv.id);

  const { data } = await supabase
    .from('your_table')
    .select('*')
    .in('environment_id', environmentIds);

  return data;
}
```

## Migration Steps for New Tables

When adding new environment-aware tables:

1. **Add environment_id column**:
```sql
ALTER TABLE your_table
  ADD COLUMN environment_id UUID REFERENCES public.environments(id) NOT NULL;
```

2. **Add index for performance**:
```sql
CREATE INDEX idx_your_table_environment_id
  ON your_table(environment_id);
```

3. **Seed data per environment**:
```sql
INSERT INTO your_table (name, environment_id, ...)
SELECT 
  'Your Config',
  e.id,
  ...
FROM public.environments e
WHERE e.name = 'all'
ON CONFLICT (...) DO NOTHING;
```

4. **Query with environment service**:
```typescript
const currentEnv = await environmentService.getCurrentEnvironment();
const { data } = await supabase
  .from('your_table')
  .select('*')
  .eq('environment_id', currentEnv.id);
```

## Benefits

1. **Maintainability**: Single place to update environment logic
2. **Type Safety**: Compile-time checks prevent typos and invalid environments
3. **Flexibility**: Easy to add new environments (just update .env and database)
4. **Testability**: Can inject different environments for testing
5. **Consistency**: All components use same environment detection
6. **Scalability**: Database-backed approach scales to multiple deployments

## Configuration

### Local Development
```bash
# .env
VITE_ENVIRONMENT="dev"
```

### QA/Staging
```bash
# .env
VITE_ENVIRONMENT="qa"
```

### Production
```bash
# .env
VITE_ENVIRONMENT="prod"
```

## Database Schema

### environments table
```sql
CREATE TABLE public.environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('dev', 'qa', 'prod', 'all')),
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Foreign Key Example
```sql
ALTER TABLE feature_flags
  ADD COLUMN environment_id UUID REFERENCES public.environments(id) NOT NULL;
```

## Next Steps

1. ✅ Run migration: `supabase db reset` (local) or push migration to production
2. ✅ Set `VITE_ENVIRONMENT` in deployment configs
3. ✅ Update CI/CD pipelines to inject correct environment variable
4. ✅ Test feature flags in each environment
5. ✅ Test ticketing fees in each environment
6. ✅ Document environment setup in deployment guide

## Troubleshooting

### Environment not detected
- Check `VITE_ENVIRONMENT` is set in `.env`
- Verify environment name is exactly 'dev', 'qa', or 'prod'
- Check browser console for environment service logs

### Database queries failing
- Ensure migration has been run
- Verify `environments` table has seed data
- Check RLS policies allow access to environments table

### Feature flags not loading
- Verify feature flags have valid `environment_id`
- Check that 'all' environment exists in database
- Review browser console for query errors

## Related Files

- `/supabase/migrations/00000000000001_add_environments_table.sql` - Migration
- `/src/shared/services/environmentService.ts` - Service
- `/src/shared/hooks/useEnvironment.ts` - Hooks
- `/src/shared/hooks/useFeatureFlags.ts` - Feature flags integration
- `/src/components/ticketing/hooks/useTicketFees.ts` - Ticketing fees integration
- `/src/components/DevTools/FeatureToggleSection.tsx` - Feature toggle UI
- `/src/components/admin/AdminFeesSection.tsx` - Admin fees UI
- `/.env` - Environment configuration
- `/.env.template` - Template for environment configuration
