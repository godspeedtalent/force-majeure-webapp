# Before & After: Migration Examples

This document shows concrete examples of how code changes when migrating to the Feature-Based Architecture.

## Example 1: Auth Feature

### BEFORE: Old Structure

```
src/
├── components/
│   └── auth/
│       └── PermissionGuard.tsx
├── pages/
│   └── Auth.tsx
├── hooks/
│   └── useAuth.ts
└── services/
    └── auth/
        └── authService.ts
```

**Imports (Before):**

```typescript
// In some feature component
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth/authService';
```

### AFTER: New Structure

```
src/
└── features/
    └── auth/
        ├── components/
        │   ├── PermissionGuard.tsx
        │   └── index.ts
        ├── pages/
        │   ├── Auth.tsx
        │   └── index.ts
        ├── hooks/
        │   ├── useAuth.ts
        │   └── index.ts
        ├── services/
        │   ├── authService.ts
        │   └── index.ts
        └── index.ts
```

**Imports (After):**

```typescript
// In some feature component
import { PermissionGuard, useAuth, authService } from '@features/auth';

// Or individually:
import { PermissionGuard } from '@features/auth';
import { useAuth } from '@features/auth';
import { authService } from '@features/auth';
```

**Benefits:**

- ✅ All auth code in one place
- ✅ Cleaner imports
- ✅ Easy to find related code
- ✅ Single source of truth

---

## Example 2: Shared Button Component

### BEFORE: Mixed Locations

```
src/
└── components/
    ├── common/
    │   └── Button.tsx
    └── primitives/
        └── Button.tsx  (duplicate?)
```

**Import (Before):**

```typescript
import { Button } from '@/components/common/Button';
// or
import { Button } from '../../components/common/Button';
```

### AFTER: Clear Location

```
src/
└── shared/
    └── components/
        ├── Button.tsx
        └── index.ts
```

**Import (After):**

```typescript
import { Button } from '@shared/components/Button';
// or using shorthand:
import { Button } from '@components/Button';
```

**Benefits:**

- ✅ No confusion about which Button to use
- ✅ Consistent import pattern
- ✅ Clear that it's shared code

---

## Example 3: Event Page Component

### BEFORE: Page with Mixed Imports

```typescript
// src/pages/EventDetails.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { EventCard } from '@/components/events/EventCard';
import { TicketList } from '@/components/ticketing/TicketList';
import { Button } from '@/components/common/Button';
import { useEvent } from '@/hooks/useEvent';
import { eventService } from '@/services/events/eventService';

export const EventDetails = () => {
  const { eventId } = useParams();
  const { data: event } = useEvent(eventId);

  return (
    <div>
      <EventCard event={event} />
      <TicketList eventId={eventId} />
      <Button>Buy Tickets</Button>
    </div>
  );
};
```

### AFTER: Clean Feature-Based Imports

```typescript
// src/features/events/pages/EventDetails.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { EventCard, useEvent, eventService } from '@features/events';
import { TicketList } from '@features/ticketing';
import { Button } from '@components/Button';

export const EventDetails = () => {
  const { eventId } = useParams();
  const { data: event } = useEvent(eventId);

  return (
    <div>
      <EventCard event={event} />
      <TicketList eventId={eventId} />
      <Button>Buy Tickets</Button>
    </div>
  );
};
```

**Benefits:**

- ✅ Clear separation of concerns
- ✅ Obvious which features are dependencies
- ✅ Easier to refactor
- ✅ Better code splitting potential

---

## Example 4: Feature Index File

### Creating the Auth Feature Index

```typescript
// src/features/auth/index.ts
/**
 * Auth Feature Module
 *
 * Exports all auth-related components, hooks, services, and types
 */

// Components
export { PermissionGuard } from './components/PermissionGuard';
export { LoginForm } from './components/LoginForm';
export { SignupForm } from './components/SignupForm';

// Hooks
export { useAuth } from './hooks/useAuth';
export { usePermissions } from './hooks/usePermissions';

// Services
export { authService } from './services/authService';
export { permissionService } from './services/permissionService';

// Types
export type { User, AuthState, Permission } from './types';

// Pages
export { default as AuthPage } from './pages/Auth';
```

**Usage:**

```typescript
// Can import everything from one place
import {
  PermissionGuard,
  LoginForm,
  useAuth,
  authService,
  type User,
} from '@features/auth';
```

---

## Example 5: Shared vs Feature-Specific

### WRONG: Everything in Shared

```
❌ src/shared/components/
    ├── Button.tsx          ✓ Good (used everywhere)
    ├── Card.tsx            ✓ Good (used everywhere)
    ├── EventCard.tsx       ✗ Wrong (only used in events)
    ├── LoginForm.tsx       ✗ Wrong (only used in auth)
    └── TicketList.tsx      ✗ Wrong (only used in ticketing)
```

### RIGHT: Clear Separation

```
✓ src/shared/components/
    ├── Button.tsx          ✓ Used by all features
    └── Card.tsx            ✓ Used by all features

✓ src/features/events/components/
    └── EventCard.tsx       ✓ Only used in events feature

✓ src/features/auth/components/
    └── LoginForm.tsx       ✓ Only used in auth feature

✓ src/features/ticketing/components/
    └── TicketList.tsx      ✓ Only used in ticketing feature
```

---

## Example 6: Migrating a Hook

### BEFORE: Generic Hooks Directory

```typescript
// src/hooks/useEvent.ts
export const useEvent = (eventId: string) => {
  // Event-specific logic
  return { data, loading, error };
};

// Usage:
import { useEvent } from '@/hooks/useEvent';
```

### AFTER: Feature-Specific Hook

```typescript
// src/features/events/hooks/useEvent.ts
export const useEvent = (eventId: string) => {
  // Event-specific logic
  return { data, loading, error };
};

// src/features/events/hooks/index.ts
export { useEvent } from './useEvent';

// src/features/events/index.ts
export * from './hooks';

// Usage:
import { useEvent } from '@features/events';
```

---

## Example 7: Service Migration

### BEFORE: Services Directory

```
src/services/
├── auth/
│   └── authService.ts
├── events/
│   └── eventService.ts
└── apiClient.ts  (shared)
```

### AFTER: Feature Services + Shared

```
src/
├── features/
│   ├── auth/
│   │   └── services/
│   │       └── authService.ts
│   └── events/
│       └── services/
│           └── eventService.ts
└── shared/
    └── services/
        └── apiClient.ts  (truly shared)
```

**Import Changes:**

```typescript
// Before:
import { authService } from '@/services/auth/authService';
import { eventService } from '@/services/events/eventService';
import { apiClient } from '@/services/apiClient';

// After:
import { authService } from '@features/auth';
import { eventService } from '@features/events';
import { apiClient } from '@shared/services/apiClient';
```

---

## Example 8: Type Definitions

### BEFORE: Central Types Directory

```typescript
// src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// src/types/event.ts
export interface Event {
  id: string;
  title: string;
  date: string;
}
```

### AFTER: Feature Types + Shared

```typescript
// src/features/auth/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// src/features/events/types/event.ts
export interface Event {
  id: string;
  title: string;
  date: string;
}

// If User is used across features, move to shared:
// src/shared/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## Import Pattern Comparison

### Old Pattern

```typescript
import { Component1 } from '@/components/feature1/Component1';
import { Component2 } from '@/components/feature2/Component2';
import { useHook1 } from '@/hooks/useHook1';
import { useHook2 } from '@/hooks/useHook2';
import { service1 } from '@/services/feature1/service1';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/date';
```

### New Pattern

```typescript
import { Component1, useHook1, service1 } from '@features/feature1';
import { Component2, useHook2 } from '@features/feature2';
import { Button } from '@components/Button';
import { formatDate } from '@utils/date';
```

**Lines of imports: 7 → 4** ✅

---

## Real-World Refactoring Example

### BEFORE: Messy Component

```typescript
// src/pages/EventManagement.tsx
import React from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EventList } from '../../components/events/EventList';
import { EventForm } from '../../components/events/EventForm';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/events/eventService';
import { formatDate } from '../../utils/date';
import type { Event } from '../../types/event';

export const EventManagement = () => {
  const { user } = useAuth();
  const { events, loading } = useEvents();

  const handleCreate = async (data: Partial<Event>) => {
    await eventService.create(data);
  };

  return (
    <div>
      <h1>Event Management</h1>
      <Card>
        <EventForm onSubmit={handleCreate} />
      </Card>
      <EventList
        events={events}
        loading={loading}
        formatDate={formatDate}
      />
    </div>
  );
};
```

### AFTER: Clean Component

```typescript
// src/features/events/pages/EventManagement.tsx
import React from 'react';
import { Button, Card } from '@components';
import { EventList, EventForm, useEvents, eventService } from '@features/events';
import { useAuth } from '@features/auth';
import { formatDate } from '@utils/date';
import type { Event } from '@features/events';

export const EventManagement = () => {
  const { user } = useAuth();
  const { events, loading } = useEvents();

  const handleCreate = async (data: Partial<Event>) => {
    await eventService.create(data);
  };

  return (
    <div>
      <h1>Event Management</h1>
      <Card>
        <EventForm onSubmit={handleCreate} />
      </Card>
      <EventList
        events={events}
        loading={loading}
        formatDate={formatDate}
      />
    </div>
  );
};
```

**Benefits:**

- ✅ Shorter import paths
- ✅ Grouped by feature
- ✅ Clear dependencies
- ✅ Easier to test

---

## Summary of Changes

| Aspect              | Before                    | After                      |
| ------------------- | ------------------------- | -------------------------- |
| **Structure**       | Flat, by type             | Nested, by feature         |
| **Imports**         | Relative paths, scattered | Path aliases, grouped      |
| **Organization**    | All components together   | Feature-based grouping     |
| **Discoverability** | Search everywhere         | Look in feature folder     |
| **Dependencies**    | Hidden in imports         | Clear from feature imports |
| **Testing**         | Difficult to isolate      | Easy feature isolation     |
| **Team Work**       | File conflicts common     | Features can be separate   |

---

**Keep this document handy during migration!**
