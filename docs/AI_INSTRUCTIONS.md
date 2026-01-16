# AI Instructions - TypeScript Standards

> **Shared standards for all AI assistants working on this codebase**

This document defines TypeScript standards that apply across all AI assistants (Claude, Cursor, GitHub Copilot, etc.). These rules complement the project-specific conventions in [CLAUDE.md](../CLAUDE.md).

---

## TypeScript Strict Mode

**All packages use TypeScript strict mode with these settings:**

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

// 3. Shared package imports
import { supabase, useEvents, Event } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';

// 4. Internal package imports (with @ alias)
import { Button } from '@/components/ui/Button';
import { Layout } from '@/components/layout/Layout';

// 5. Relative imports (same directory)
import { EventCard } from './EventCard';
import type { EventCardProps } from './types';
```

---

## Null vs Undefined

**Use the right convention for the context:**

### Database Fields (Shared Package)

```typescript
// ✅ Use null for database fields (Supabase/PostgreSQL convention)
interface Event {
  id: string;
  description: string | null;  // null if not provided
  venue_id: string | null;     // null if no venue
}
```

### React Props (Web/Mobile)

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

### Centralized Types (Shared Package)

**All domain types live in `packages/shared/src/types/features/`:**

```
packages/shared/src/types/features/
├── events.ts        # Event, TicketTier, Venue, Artist
├── orders.ts        # Order, OrderItem, Payment
├── users.ts         # User, Profile, UserRole
└── products.ts      # Product, ProductVariant
```

### Platform-Specific Types

**Web-specific types in `packages/web/src/`:**

```typescript
// packages/web/src/types/components.ts
export interface FmButtonProps {
  variant: 'default' | 'outline' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  // ...
}
```

**Mobile-specific types in `packages/mobile/src/`:**

```typescript
// packages/mobile/src/types/navigation.ts
export type RootStackParamList = {
  Home: undefined;
  EventDetails: { eventId: string };
  // ...
};
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

## React Query Patterns (Shared Package)

**Query hooks in `packages/shared/src/api/queries/`:**

```typescript
// packages/shared/src/api/queries/eventQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import type { Event } from '../../types/features/events';

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
pnpm supabase:db:reset

# Regenerate types (outputs to packages/shared/src/api/supabase/types.ts)
pnpm supabase:gen-types
```

**Use generated types:**

```typescript
import type { Database } from '@force-majeure/shared/api/supabase/types';

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

### ❌ Importing from Wrong Package

```typescript
// Wrong - web importing from mobile
import { Screen } from '@force-majeure/mobile';

// Correct - use shared for cross-platform code
import { Event } from '@force-majeure/shared';
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
  const { data } = useEvents(); // Hook defined in shared/api/queries/
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

- [ ] All packages use strict TypeScript mode
- [ ] No `any` types (use `unknown` if truly unknown)
- [ ] Explicit return types for exported functions
- [ ] Null/undefined handled explicitly with optional chaining (`?.`) and nullish coalescing (`??`)
- [ ] Type predicates match their parameter types
- [ ] Unused parameters prefixed with `_`
- [ ] Imports follow standard order (React → third-party → shared → internal → relative)
- [ ] Database fields use `null`, React props use `undefined`
- [ ] Structured logging with context objects
- [ ] Centralized types in shared package
- [ ] Platform boundaries respected (no cross-imports between web/mobile)
- [ ] React Query hooks in shared package `api/queries/`
- [ ] Errors handled explicitly with try-catch or error checking
- [ ] Prefer async/await over promise chains

---

**For more project-specific conventions, see [CLAUDE.md](../CLAUDE.md)**
