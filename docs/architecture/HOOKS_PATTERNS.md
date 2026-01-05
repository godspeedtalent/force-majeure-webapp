# Hooks Patterns Guide

> Standard patterns for React hooks in the Force Majeure codebase.

---

## Table of Contents

- [Data Fetching](#data-fetching)
- [Async Mutations](#async-mutations)
- [Event Form Hooks](#event-form-hooks)
- [Custom Hook Guidelines](#custom-hook-guidelines)

---

## Data Fetching

**CRITICAL: Use centralized React Query hooks for all data fetching in components.**

### Correct Pattern

```typescript
// ✅ Use React Query hooks from @/shared
import { useEventById, useVenueById, useArtists } from '@/shared';

function EventDetails({ eventId }: { eventId: string }) {
  const { data: event, isLoading, error } = useEventById(eventId);
  const { data: venues } = useVenues();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{event.name}</div>;
}
```

### Anti-Pattern

```typescript
// ❌ Wrong - Direct Supabase calls in components
function EventDetails({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('events').select('*').eq('id', eventId)
      .then(({ data }) => setEvent(data))
      .finally(() => setLoading(false));
  }, [eventId]);
}
```

### Available Query Hooks

Located in `@/shared/api/queries/`:

| Category | Hooks |
|----------|-------|
| Events | `useEventById`, `useEvents`, `useUpcomingEvents` |
| Venues | `useVenueById`, `useVenues` |
| Artists | `useArtistById`, `useArtists`, `useArtistWithGenres` |
| Orders | `useOrderById`, `useOrders` |
| Tickets | `useTicketTiersByEventId` |
| Products | `useProducts` |

### When Direct Supabase Calls Are Acceptable

- Inside service functions (`features/*/services/`)
- Inside React Query hook definitions
- For admin/developer tools that don't need caching

### Benefits of React Query Hooks

- Automatic caching and request deduplication
- Loading/error states handled automatically
- Background refetching for stale data
- Type-safe responses from database types

---

## Async Mutations

**Use `useAsyncMutation` for all async operations that modify data.**

### The Hook

```typescript
import { useAsyncMutation } from '@/shared';

const { execute, isLoading, error } = useAsyncMutation({
  mutationFn: async (data: FormData) => {
    return await someService.save(data);
  },
  successMessage: 'Saved successfully!',
  errorMessage: 'Failed to save',
  onSuccess: (result) => {
    // Optional callback after success
    navigate('/success');
  },
  throwOnError: false, // Set true to re-throw for try/catch handling
  invalidateKeys: [['events']], // Optional React Query cache invalidation
});

// Usage
<Button onClick={() => execute(formData)} disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Anti-Pattern - Manual Loading States

```typescript
// ❌ Wrong - Manual loading state boilerplate
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveData();
    toast.success('Saved!');
  } catch (e) {
    toast.error('Failed');
  } finally {
    setIsSaving(false);
  }
};
```

### When to Use useAsyncMutation

- Form submissions
- CRUD operations (create, update, delete)
- Any async action that needs loading/success/error feedback
- Operations that should invalidate React Query cache

### Hook Options

| Option | Type | Description |
|--------|------|-------------|
| `mutationFn` | `(args: T) => Promise<R>` | The async function to execute |
| `successMessage` | `string` | Toast message on success |
| `errorMessage` | `string` | Toast message on error |
| `onSuccess` | `(result: R) => void` | Callback after successful execution |
| `onError` | `(error: Error) => void` | Callback after failed execution |
| `throwOnError` | `boolean` | Re-throw errors for try/catch handling |
| `invalidateKeys` | `QueryKey[]` | React Query keys to invalidate on success |

### Deprecated Hooks

These hooks are deprecated - migrate to `useAsyncMutation`:

- `useAsyncAction` - Use `useAsyncMutation` with `throwOnError: true`
- `useMutationWithToast` - Use `useAsyncMutation` with `invalidateKeys`

---

## Event Form Hooks

The event form system uses a well-organized hook architecture with clear separation of concerns.

### Hook Structure

| Hook | Purpose | Location |
|------|---------|----------|
| `useEventFormState` | State management & types | `features/events/hooks/useEventFormState.ts` |
| `useEventFormValidation` | Validation logic | `features/events/hooks/useEventFormValidation.ts` |
| `useEventFormSubmit` | Submission with async mutation | `features/events/hooks/useEventFormSubmit.ts` |
| `useEventForm` | Combined hook for components | `features/events/hooks/useEventForm.ts` |
| `useEventData` | Data fetching for edit mode | `features/events/hooks/useEventData.ts` |

### Usage Examples

**Creating a new event:**

```typescript
import { useEventForm } from '@/features/events/hooks/useEventForm';

function CreateEventPage() {
  const { submitForm, isLoading, validateForm, calculateTicketStats } = useEventForm({
    mode: 'create',
    onSuccess: () => navigate('/events'),
  });

  const handleSubmit = async (formState: EventFormState) => {
    const error = validateForm(formState);
    if (error) {
      toast.error(error);
      return;
    }
    await submitForm(formState);
  };
}
```

**Editing an existing event:**

```typescript
import { useEventData } from '@/features/events/hooks/useEventData';
import { useEventForm } from '@/features/events/hooks/useEventForm';

function EditEventPage({ eventId }: { eventId: string }) {
  const { formState, setFormState, isLoading: dataLoading } = useEventData(eventId);
  const { submitForm, isLoading } = useEventForm({
    eventId,
    mode: 'edit',
    onSuccess: () => navigate('/events'),
  });

  if (dataLoading) return <Spinner />;
}
```

**Custom validation only:**

```typescript
import { useEventFormValidation } from '@/features/events/hooks/useEventFormValidation';

const { validateForm, errors } = useEventFormValidation(formState);
```

### Key Types

Defined in `useEventFormState.ts`:

- `EventFormState` - Complete form state shape
- `TicketTier` - Ticket tier configuration
- `UndercardArtist` - Supporting artist entry

---

## Custom Hook Guidelines

### Naming

- Always prefix with `use` (e.g., `useEventData`, `useFormState`)
- Be descriptive about what the hook does
- Follow the pattern: `use[Entity][Action]` (e.g., `useEventFormSubmit`)

### Structure

```typescript
// Good hook structure
export interface UseMyHookOptions {
  // Required options
  entityId: string;
  // Optional options with defaults
  autoFetch?: boolean;
}

export interface UseMyHookReturn {
  // Data
  data: MyData | null;
  // State
  isLoading: boolean;
  error: Error | null;
  // Actions
  refetch: () => void;
  update: (data: Partial<MyData>) => Promise<void>;
}

export function useMyHook(options: UseMyHookOptions): UseMyHookReturn {
  const { entityId, autoFetch = true } = options;

  // Implementation...

  return {
    data,
    isLoading,
    error,
    refetch,
    update,
  };
}
```

### Best Practices

1. **Single Responsibility** - Each hook should do one thing well
2. **Type Everything** - Export options and return types as interfaces
3. **Default Values** - Provide sensible defaults for optional parameters
4. **Memoization** - Use `useMemo` and `useCallback` appropriately
5. **Error Handling** - Return error state, don't just throw
6. **Loading States** - Always expose loading state for UI feedback

### When to Extract a Hook

Extract logic into a custom hook when:

- Logic is reused across multiple components
- Component file exceeds 300 lines
- Complex state management obscures component rendering logic
- Side effects (data fetching, subscriptions) are involved

---

*Last updated: January 2026*
