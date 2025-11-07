# Error Handler Migration Examples

This document shows real examples of migrating from old error handling patterns to the new centralized `handleError()` system.

## Example 1: Basic API Call

### Before ❌

```typescript
import { logApiError } from '@/shared/utils/apiLogger';
import { toast } from 'sonner';

try {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId);

  if (error) throw error;
  return data;
} catch (error) {
  console.error('Error loading event:', error);
  await logApiError({
    endpoint: 'events',
    method: 'SELECT',
    message: 'Failed to load event',
    details: error,
  });
  toast.error('Failed to load event');
}
```

### After ✅

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId);

  if (error) throw error;
  return data;
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Event',
    description: 'Could not retrieve event details',
    endpoint: 'events',
    method: 'SELECT',
  });
}
```

## Example 2: Silent Background Operation

### Before ❌

```typescript
try {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error loading stats:', error);
    return [];
  }
  return data;
} catch (error) {
  console.error('Unexpected error:', error);
  return [];
}
```

### After ✅

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Stats',
    description: 'Could not retrieve user statistics',
    endpoint: 'orders',
    method: 'SELECT',
    showToast: false, // Don't disturb user for background ops
  });
  return [];
}
```

## Example 3: Multiple Error Types

### Before ❌

```typescript
try {
  await updateEvent(eventData);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    toast.error(error.message);
  } else if (typeof error === 'object' && error !== null) {
    const err = error as any;
    console.error('Supabase error:', err);
    toast.error(err.message || 'Operation failed');
  } else {
    console.error('Unknown error:', error);
    toast.error('An unexpected error occurred');
  }
}
```

### After ✅

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  await updateEvent(eventData);
} catch (error) {
  // Automatically handles all error types
  await handleError(error, {
    title: 'Failed to Update Event',
    description: 'Could not save event changes',
    endpoint: 'events',
    method: 'UPDATE',
  });
}
```

## Example 4: With Success Toast

### Before ❌

```typescript
import { toast } from 'sonner';

try {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: newName })
    .eq('id', userId);

  if (error) throw error;

  toast.success('Profile updated');
} catch (error) {
  console.error('Update failed:', error);
  toast.error('Failed to update profile');
}
```

### After ✅

```typescript
import { handleError } from '@/shared/services/errorHandler';
import { toast } from 'sonner';

try {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: newName })
    .eq('id', userId);

  if (error) throw error;

  toast.success('Profile updated');
} catch (error) {
  await handleError(error, {
    title: 'Failed to Update Profile',
    description: 'Could not save profile changes',
    endpoint: 'profiles',
    method: 'UPDATE',
  });
}
```

## Example 5: Network Request

### Before ❌

```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('Network error:', error);
  toast.error('Failed to fetch data');
  throw error;
}
```

### After ✅

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  await handleError(error, {
    title: 'Network Request Failed',
    description: 'Could not fetch data from server',
    endpoint: '/api/data',
    method: 'GET',
  });
  throw error;
}
```

## Example 6: Using withErrorHandler Wrapper

### Before ❌

```typescript
const loadEvent = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to load event');
    return null;
  }
};
```

### After ✅

```typescript
import { withErrorHandler } from '@/shared/services/errorHandler';

const loadEvent = async (id: string) => {
  return withErrorHandler(
    async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    {
      title: 'Failed to Load Event',
      endpoint: 'events',
      method: 'SELECT',
    }
  );
  // Returns null if error occurs
};
```

## Example 7: Real-World: Search Component

### Before ❌

```typescript
// GlobalSearch.tsx
import { logApiError } from '@/shared/utils/apiLogger';

const performSearch = useCallback(async (query: string) => {
  setIsSearching(true);
  try {
    const [eventsRes, artistsRes, venuesRes] = await Promise.all([
      supabase.from('events').select('*').ilike('title', `%${query}%`),
      supabase.from('artists').select('*').ilike('name', `%${query}%`),
      supabase.from('venues').select('*').ilike('name', `%${query}%`),
    ]);

    setResults({
      events: eventsRes.data || [],
      artists: artistsRes.data || [],
      venues: venuesRes.data || [],
    });
  } catch (error) {
    await logApiError({
      endpoint: 'GlobalSearch',
      method: 'SEARCH',
      message: 'Search error',
      details: error,
    });
  } finally {
    setIsSearching(false);
  }
}, []);
```

### After ✅

```typescript
// GlobalSearch.tsx
import { handleError } from '@/shared/services/errorHandler';

const performSearch = useCallback(async (query: string) => {
  setIsSearching(true);
  try {
    const [eventsRes, artistsRes, venuesRes] = await Promise.all([
      supabase.from('events').select('*').ilike('title', `%${query}%`),
      supabase.from('artists').select('*').ilike('name', `%${query}%`),
      supabase.from('venues').select('*').ilike('name', `%${query}%`),
    ]);

    setResults({
      events: eventsRes.data || [],
      artists: artistsRes.data || [],
      venues: venuesRes.data || [],
    });
  } catch (error) {
    await handleError(error, {
      title: 'Search Failed',
      description: 'Failed to search across events, artists, and venues',
      endpoint: 'GlobalSearch',
      method: 'SEARCH',
    });
  } finally {
    setIsSearching(false);
  }
}, []);
```

## Example 8: Real-World: Profile Update

### Before ❌

```typescript
// ProfileEdit.tsx
const handleSave = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name, bio, avatar_url })
      .eq('id', user.id);

    if (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
      return;
    }

    toast.success('Profile updated');
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
  }
};
```

### After ✅

```typescript
// ProfileEdit.tsx
import { handleError } from '@/shared/services/errorHandler';

const handleSave = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name, bio, avatar_url })
      .eq('id', user.id);

    if (error) throw error;

    toast.success('Profile updated');
  } catch (error) {
    await handleError(error, {
      title: 'Failed to Update Profile',
      description: 'Could not save profile changes',
      endpoint: 'profiles',
      method: 'UPDATE',
    });
  }
};
```

## Quick Migration Checklist

When updating a file:

1. ✅ Add import: `import { handleError } from '@/shared/services/errorHandler';`
2. ✅ Remove: `import { logApiError } from '@/shared/utils/apiLogger';` (if present)
3. ✅ Replace `console.error()` with nothing (handleError logs automatically)
4. ✅ Replace manual `toast.error()` with handleError
5. ✅ Replace `await logApiError({...})` with `await handleError(error, {...})`
6. ✅ Add descriptive `title` and `description`
7. ✅ Add `endpoint` and `method` for API calls
8. ✅ Set `showToast: false` for silent errors
9. ✅ Remove `try/catch` boilerplate - handleError does it all

## Benefits Summary

| Old Pattern             | New Pattern               |
| ----------------------- | ------------------------- |
| Multiple imports        | Single import             |
| Manual logging          | Automatic logging         |
| Generic error messages  | Contextual error messages |
| Same for all users      | Different for devs/users  |
| No copy functionality   | Copyable error details    |
| Inconsistent formatting | Consistent UX             |
| More code               | Less code                 |

## Need Help?

See [ERROR_HANDLING_GUIDE.md](../ERROR_HANDLING_GUIDE.md) for complete documentation.
