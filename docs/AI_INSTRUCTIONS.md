# AI Instructions - TypeScript Standards

> **Shared standards for all AI assistants working on this codebase**

This document defines TypeScript standards that apply across all AI assistants (Claude, Cursor, GitHub Copilot, etc.). These rules complement the project-specific conventions in [CLAUDE.md](../CLAUDE.md).

---

## TypeScript Strict Mode

**This project uses TypeScript strict mode with these settings:**

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitAny": true,
  "noFallthroughCasesInSwitch": true
}
```

### Type Safety Rules

1. **No `any` Types**
   ```typescript
   // ❌ Wrong
   const data: any = fetchData();

   // ✅ Correct
   const data: Event = fetchData();
   // Or if truly unknown:
   const data: unknown = fetchData();
   ```

2. **Explicit Return Types for Exported Functions**
   ```typescript
   // ❌ Wrong
   export function getEventById(id: string) {
     return supabase.from('events').select('*').eq('id', id).single();
   }

   // ✅ Correct
   export function getEventById(id: string): Promise<Event | null> {
     return supabase.from('events').select('*').eq('id', id).single();
   }
   ```

3. **Handle Null and Undefined Explicitly**
   ```typescript
   // ❌ Wrong - assumes title exists
   const title = event.title.toUpperCase();

   // ✅ Correct - handles undefined/null
   const title = event.title?.toUpperCase() ?? 'Untitled';
   ```

4. **Use Type Predicates Correctly**
   ```typescript
   // ❌ Wrong - parameter type doesn't match predicate
   function isEvent(value?: Event): value is Event {
     return value !== undefined && value.id !== undefined;
   }

   // ✅ Correct - parameter allows undefined
   function isEvent(value: Event | undefined): value is Event {
     return value !== undefined && value.id !== undefined;
   }
   ```

---

## Import Organization

**Standard import order:**

```typescript
// 1. React/React Native
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner'; // web only

// 3. Internal imports (with @/ alias)
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import type { Event } from '@/shared/types';

// 4. Component imports
import { Button } from '@/components/common/ui/Button';
import { Layout } from '@/components/layout/Layout';

// 5. Relative imports (same directory)
import { EventCard } from './EventCard';
import type { EventCardProps } from './types';
```

---

## Null vs Undefined

**Use the right convention for the context:**

### Database Fields

```typescript
// ✅ Use null for database fields (Supabase/PostgreSQL convention)
interface Event {
  id: string;
  description: string | null;  // null if not provided
  venue_id: string | null;     // null if no venue
}
```

### React Props

```typescript
// ✅ Use undefined for optional props (TypeScript/React convention)
interface ButtonProps {
  label: string;
  onClick?: () => void;  // undefined if not provided
  icon?: React.ReactNode; // undefined if not provided
}
```

### Convert Between Conventions

```typescript
// Database → React (null → undefined)
const venueId = event.venue_id ?? undefined;

// React → Database (undefined → null)
const venue_id = venueId || null;
```

---

## Logger Usage

**Always use structured logging with context objects:**

```typescript
// ❌ Wrong
logger.error('Error loading events', error);

// ✅ Correct
logger.error('Error loading events', {
  error: error instanceof Error ? error.message : 'Unknown error',
  source: 'EventList',
  userId: user?.id,
  timestamp: new Date().toISOString(),
});
```

**Log levels:**

- `logger.debug()` - Development debugging (not in production)
- `logger.info()` - General informational messages
- `logger.warn()` - Warning conditions that should be reviewed
- `logger.error()` - Error conditions that need attention

---

## Type Definitions

### Centralized Types

**Domain types are organized by feature in `src/`:**

```
src/
├── shared/types/           # Shared type definitions
├── features/events/types/  # Event, TicketTier types
├── features/orders/types/  # Order, OrderItem types
├── features/auth/types/    # User, Profile types
└── integrations/supabase/types.ts  # Auto-generated DB types
```

### Component Types

**Component props are defined alongside components:**

```typescript
// src/components/common/ui/FmCommonButton.tsx
export interface FmCommonButtonProps {
  variant: 'default' | 'outline' | 'destructive' | 'gold';
  size: 'sm' | 'md' | 'lg';
  // ...
}
```

---

## Unused Parameters

**Prefix unused parameters with underscore:**

```typescript
// ❌ Wrong - TypeScript error with noUnusedParameters
function handleClick(event: React.MouseEvent) {
  console.log('clicked');
}

// ✅ Correct - underscore prefix
function handleClick(_event: React.MouseEvent) {
  console.log('clicked');
}

// ✅ Also correct - omit parameter name if truly not needed
function handleClick() {
  console.log('clicked');
}
```

---

## Error Handling

**Always handle errors explicitly:**

```typescript
// ❌ Wrong - unhandled promise rejection
const data = await supabase.from('events').select('*');

// ✅ Correct - explicit error handling
try {
  const { data, error } = await supabase.from('events').select('*');
  if (error) throw error;

  return data;
} catch (error) {
  logger.error('Failed to fetch events', {
    error: error instanceof Error ? error.message : 'Unknown',
    source: 'useEvents',
  });
  toast.error('Failed to load events'); // web only
  return [];
}
```

---

## Async/Await vs Promises

**Prefer async/await over .then() chains:**

```typescript
// ❌ Wrong - promise chaining
function fetchEvent(id: string) {
  return supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
}

// ✅ Correct - async/await
async function fetchEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

---

## React Query Patterns

**Query hooks are defined in feature directories or shared hooks:**

```typescript
// src/shared/hooks/useEvents.ts or src/features/events/hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/shared/types';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: string) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.lists(),
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
```

---

## Database Type Generation

**After modifying database schema:**

```bash
# Apply migrations
npm run supabase:db:reset

# Regenerate types (outputs to src/integrations/supabase/types.ts)
npm run supabase:gen-types
```

**Use generated types:**

```typescript
import type { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];
```

---

## Testing

**Write tests that follow TypeScript standards:**

```typescript
import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validation';

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should handle undefined', () => {
    expect(isValidEmail(undefined)).toBe(false);
  });
});
```

---

## Common Violations

### ❌ Accessing Properties on Possibly Undefined Types

```typescript
// Wrong - event.title might not exist
const title = event.title.toUpperCase();

// Correct - handle undefined
const title = event.title?.toUpperCase() ?? 'Untitled';
```

### ❌ Importing from Wrong Location

```typescript
// Wrong - importing from non-existent paths
import { Event } from '@/types/Event';
import { supabase } from 'supabase';

// Correct - use established import paths
import type { Event } from '@/shared/types';
import { supabase } from '@/integrations/supabase/client';
```

### ❌ Using any

```typescript
// Wrong
const data: any = await fetchData();

// Correct
const data: Event[] = await fetchData();
```

### ❌ Inconsistent Null/Undefined Usage

```typescript
// Wrong - mixing conventions
interface Props {
  title: string | null;  // Database-style in React props
  onClick?: () => void | null; // Redundant null
}

// Correct
interface Props {
  title?: string;  // React convention (undefined)
  onClick?: () => void;
}
```

### ❌ Direct Supabase Calls in Components

```typescript
// Wrong - direct database call in component
function MyComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    supabase.from('events').select().then(({ data }) => setData(data));
  }, []);
}

// Correct - use React Query hook
function MyComponent() {
  const { data } = useEvents(); // Hook defined in shared/hooks/ or features/*/hooks/
}
```

### ❌ Raw Error Handling (Not Using Centralized Handler)

```typescript
// Wrong - manual toast + logger
catch (error) {
  logger.error('Error:', error);
  toast.error('Failed');
}

// Correct - centralized handler
catch (error) {
  handleError(error, { title: 'Failed', context: 'MyComponent' });
}
```

### ❌ useState for Server Data

```typescript
// Wrong - server data in local state
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  setLoading(true);
  fetchEvents().then(data => {
    setEvents(data);
    setLoading(false);
  });
}, []);

// Correct - React Query manages server state
const { data: events, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
});
```

### ❌ Design System Violations

```typescript
// Wrong - rounded corners, arbitrary spacing, hardcoded colors
<div className="rounded-lg p-3 bg-[#dfba7d]">
  <button className="bg-fm-gold text-black">Submit</button>
</div>

// Correct - sharp corners, scale spacing, design system colors
<div className="rounded-none p-[10px] bg-fm-gold/20">
  <FmCommonButton variant="gold">Submit</FmCommonButton>
</div>
```

---

## Summary Checklist

- [ ] Project uses strict TypeScript mode
- [ ] No `any` types (use `unknown` if truly unknown)
- [ ] Explicit return types for exported functions
- [ ] Null/undefined handled explicitly with optional chaining (`?.`) and nullish coalescing (`??`)
- [ ] Type predicates match their parameter types
- [ ] Unused parameters prefixed with `_`
- [ ] Imports follow standard order (React → third-party → shared → internal → relative)
- [ ] Database fields use `null`, React props use `undefined`
- [ ] Structured logging with context objects
- [ ] Types centralized in `src/shared/types/` or feature-specific type files
- [ ] React Query hooks in `src/shared/hooks/` or `src/features/*/hooks/`
- [ ] Errors handled explicitly with try-catch or error checking
- [ ] Prefer async/await over promise chains

---

## Database Migration Best Practices

**When creating Supabase migrations, follow these patterns to avoid deployment errors:**

### Always Use DROP Before CREATE for Functions with Changed Signatures

```sql
-- ❌ Wrong - will fail if function exists with different return type
CREATE OR REPLACE FUNCTION my_function(p_id UUID)
RETURNS TABLE (col1 INTEGER, col2 INTEGER, col3 INTEGER)  -- New column added
...

-- ✅ Correct - drop first when changing signature
DROP FUNCTION IF EXISTS my_function(UUID);

CREATE FUNCTION my_function(p_id UUID)
RETURNS TABLE (col1 INTEGER, col2 INTEGER, col3 INTEGER)
...
```

**Why?** PostgreSQL's `CREATE OR REPLACE` cannot change:
- Return type (including adding/removing columns in TABLE returns)
- Parameter types or count
- Function volatility (STABLE, VOLATILE, IMMUTABLE)

### Use IF EXISTS / IF NOT EXISTS Defensively

```sql
-- Tables
CREATE TABLE IF NOT EXISTS my_table (...);
DROP TABLE IF EXISTS old_table;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_my_index ON my_table(column);
DROP INDEX IF EXISTS old_index;

-- Columns
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_column TEXT;
ALTER TABLE my_table DROP COLUMN IF EXISTS old_column;

-- Constraints
ALTER TABLE my_table DROP CONSTRAINT IF EXISTS old_constraint;
-- Note: ADD CONSTRAINT doesn't have IF NOT EXISTS, wrap in DO block:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'my_constraint'
  ) THEN
    ALTER TABLE my_table ADD CONSTRAINT my_constraint CHECK (...);
  END IF;
END $$;

-- Functions (when signature is NOT changing)
CREATE OR REPLACE FUNCTION my_function(...) ...;

-- Functions (when signature IS changing)
DROP FUNCTION IF EXISTS my_function(param_types);
CREATE FUNCTION my_function(...) ...;

-- Policies
DROP POLICY IF EXISTS "Old policy name" ON my_table;
CREATE POLICY "New policy name" ON my_table ...;

-- Triggers
DROP TRIGGER IF EXISTS old_trigger ON my_table;
CREATE TRIGGER new_trigger ...;
```

### Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name.sql

Examples:
20260120000000_add_test_profiles_table.sql
20260120100000_fix_rls_policies_for_orders.sql
20260120200000_add_stripe_webhook_function.sql
```

### RLS and Grants Checklist

When creating new tables, **ALWAYS** include:

```sql
-- 1. Create the table
CREATE TABLE IF NOT EXISTS my_table (...);

-- 2. Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 3. Create appropriate policies
CREATE POLICY "policy_name" ON my_table FOR ALL TO authenticated
  USING (...) WITH CHECK (...);

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
-- And/or for anonymous access:
GRANT SELECT ON my_table TO anon;
```

### Common Migration Pitfalls

| Issue | Solution |
|-------|----------|
| `cannot change return type of existing function` | Use `DROP FUNCTION IF EXISTS` before `CREATE FUNCTION` |
| `relation already exists` | Use `CREATE TABLE IF NOT EXISTS` |
| `column already exists` | Use `ADD COLUMN IF NOT EXISTS` |
| `policy already exists` | Use `DROP POLICY IF EXISTS` before `CREATE POLICY` |
| `constraint already exists` | Wrap in `DO $$ BEGIN ... END $$` with existence check |
| RLS blocking all access | Ensure both RLS policies AND grants are in place |

---

**For more project-specific conventions, see [CLAUDE.md](../CLAUDE.md)**
