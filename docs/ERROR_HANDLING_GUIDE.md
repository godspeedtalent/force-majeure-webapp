# Error Handling Guide

## Overview

The Force Majeure webapp uses a centralized error handling system that provides consistent, user-friendly error messages while giving developers/admins detailed debugging information.

## Key Features

- ✅ **Centralized**: Single `handleError()` function for all errors
- ✅ **Role-Aware**: Shows different content for devs/admins vs regular users
- ✅ **Copyable**: Developers can copy full error details including response body and stack traces
- ✅ **Logged**: Automatically logs errors to backend for monitoring
- ✅ **Toast Notifications**: Visual feedback with enhanced error toasts

## Quick Start

### Basic Usage

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  await supabase.from('events').insert({ title: 'My Event' });
} catch (error) {
  handleError(error, {
    title: 'Failed to Create Event',
    description: 'Could not save the event to the database',
  });
}
```

### What Users See

**Regular Users:**
- Title: "Failed to Create Event" (in crimson)
- Description: "An error occurred. Please try again."
- Duration: 4 seconds

**Developers/Admins:**
- Title: "Failed to Create Event" (in crimson)
- Description: Full error details including response body
- Error message in monospace font
- Copy button to copy full stack trace
- Duration: 8 seconds (more time to read/copy)

## API Reference

### `handleError(error, options)`

Main error handler function.

**Parameters:**

```typescript
interface ErrorHandlerOptions {
  // Required: Title shown in toast
  title: string;
  
  // User-friendly description of what failed
  description?: string;
  
  // Context about what was being done
  context?: string;
  
  // API endpoint being called (for logging)
  endpoint?: string;
  
  // HTTP method (for logging)
  method?: string;
  
  // Whether to show toast notification (default: true)
  showToast?: boolean;
  
  // Whether to log to backend (default: true)
  logError?: boolean;
  
  // User role (auto-detected if not provided)
  userRole?: string;
}
```

**Example:**

```typescript
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
    context: 'Loading event for management page',
  });
}
```

### `withErrorHandler(fn, options)`

Async wrapper that catches and handles errors.

**Example:**

```typescript
import { withErrorHandler } from '@/shared/services/errorHandler';

const event = await withErrorHandler(
  async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
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

// event will be null if error occurred
if (!event) {
  // Handle error case
  return;
}
```

### `withErrorHandlerSync(fn, options)`

Synchronous wrapper for non-async functions.

**Example:**

```typescript
import { withErrorHandlerSync } from '@/shared/services/errorHandler';

const parsed = withErrorHandlerSync(
  () => JSON.parse(jsonString),
  {
    title: 'Failed to Parse JSON',
    showToast: false, // Don't show toast for parsing errors
  }
);
```

## Common Patterns

### Pattern 1: API Calls

```typescript
import { handleError } from '@/shared/services/errorHandler';

const saveProfile = async (data: ProfileData) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);
      
    if (error) throw error;
    toast.success('Profile saved successfully');
  } catch (error) {
    await handleError(error, {
      title: 'Failed to Save Profile',
      description: 'Could not update your profile information',
      endpoint: 'profiles',
      method: 'UPDATE',
    });
  }
};
```

### Pattern 2: Silent Errors (No Toast)

```typescript
// For background operations where you don't want to disturb the user
try {
  await fetchUserStats();
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Stats',
    showToast: false, // Don't show toast
    logError: true,   // But still log it
  });
}
```

### Pattern 3: Supabase Errors

The error handler automatically extracts Supabase error details:

```typescript
try {
  const { data, error } = await supabase
    .from('events')
    .insert({ /* missing required field */ });
    
  if (error) throw error;
} catch (error) {
  await handleError(error, {
    title: 'Failed to Create Event',
    // The handler will automatically extract:
    // - error.message
    // - error.details
    // - error.code (PostgreSQL error code)
  });
}
```

### Pattern 4: HTTP Errors

```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  await handleError(error, {
    title: 'Network Request Failed',
    description: 'Could not fetch data from server',
    method: 'GET',
    endpoint: '/api/data',
  });
}
```

### Pattern 5: Multiple Operations

```typescript
const performComplexOperation = async () => {
  try {
    // Step 1
    await updateEvent(eventData);
    
    // Step 2
    await updateArtists(artistData);
    
    // Step 3
    await createTicketTiers(tiers);
    
    toast.success('All changes saved successfully');
  } catch (error) {
    // One error handler for the whole operation
    await handleError(error, {
      title: 'Failed to Save Changes',
      description: 'An error occurred while saving your changes',
      context: 'Updating event, artists, and ticket tiers',
    });
  }
};
```

## Developer Features

### What Gets Copied

When a developer/admin clicks the copy button, they get:

```
Title: Failed to Create Event
Description: Could not save the event to the database

Message: duplicate key value violates unique constraint "events_pkey"
Status: 409
Details: {
  "code": "23505",
  "details": "Key (id)=(123) already exists.",
  "hint": null
}

Stack Trace:
Error: duplicate key value violates unique constraint "events_pkey"
    at Object.create (EventManagement.tsx:145)
    at async saveEvent (EventManagement.tsx:142)
    ...
```

### Response Body Display

For developers/admins, the error toast shows the full response body in a readable format:

```typescript
// The handler automatically formats complex error responses:
handleError(error, {
  title: 'API Error',
  // Developer will see:
  // Response:
  // Message: Request failed
  // Status: 400
  // Details: { "field": "email", "error": "Invalid format" }
});
```

## Migration Guide

### Before (Old Pattern)

```typescript
import { logApiError } from '@/shared/utils/apiLogger';
import { toast } from 'sonner';

try {
  await someOperation();
} catch (error) {
  console.error('Error:', error);
  await logApiError({
    endpoint: 'someEndpoint',
    method: 'POST',
    message: 'Error occurred',
    details: error,
  });
  toast.error('Operation failed');
}
```

### After (New Pattern)

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  await someOperation();
} catch (error) {
  await handleError(error, {
    title: 'Operation Failed',
    description: 'Could not complete the operation',
    endpoint: 'someEndpoint',
    method: 'POST',
  });
}
```

## Error Types Supported

The error handler automatically handles:

1. **Standard Error objects** - Extracts message and stack trace
2. **Supabase/PostgrestError** - Extracts message, details, and code
3. **HTTP Response errors** - Extracts status, statusText, and body
4. **String errors** - Converts to Error object
5. **Unknown types** - Safely handles any error type

## Best Practices

### ✅ DO

- Use `handleError()` for all user-facing errors
- Provide clear, user-friendly titles
- Include context about what was being done
- Specify endpoint and method for API calls
- Use `showToast: false` for background operations

### ❌ DON'T

- Don't use multiple error handling patterns
- Don't show technical jargon in titles
- Don't forget to await `handleError()` (it's async)
- Don't duplicate error logging (it's automatic)

## Examples from Codebase

### GlobalSearch Component

```typescript
// src/components/search/GlobalSearch.tsx
try {
  const [eventsRes, artistsRes, venuesRes] = await Promise.all([...]);
  // Process results...
} catch (error) {
  await handleError(error, {
    title: 'Search Failed',
    description: 'Failed to search across events, artists, and venues',
    endpoint: 'GlobalSearch',
    method: 'SEARCH',
  });
}
```

### Profile Page

```typescript
// src/pages/Profile.tsx
try {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('event_id')
    .eq('user_id', user.id);
    
  if (error) throw error;
  // Process stats...
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Stats',
    description: 'Could not retrieve your event statistics',
    endpoint: 'orders',
    method: 'SELECT',
    showToast: false, // Silent error for stats
  });
}
```

### Event Management

```typescript
// src/pages/EventManagement.tsx
try {
  const { error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id);
    
  if (error) throw error;
  toast.success('Event updated successfully');
} catch (error) {
  await handleError(error, {
    title: 'Failed to Update Event',
    description: 'Could not save event changes',
    endpoint: 'EventManagement',
    method: 'UPDATE',
  });
}
```

## Testing

### Testing Error Handlers

```typescript
// Test that errors are handled properly
it('handles errors correctly', async () => {
  const mockError = new Error('Test error');
  
  // Mock handleError
  const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');
  
  // Trigger error
  await expect(async () => {
    await someFunction();
  }).rejects.toThrow();
  
  // Verify error handler was called
  expect(handleErrorSpy).toHaveBeenCalledWith(
    mockError,
    expect.objectContaining({
      title: 'Expected Title',
    })
  );
});
```

## See Also

- [FmErrorToast Component](./examples/ERROR_TOAST_EXAMPLES.tsx)
- [API Logger](../src/shared/utils/apiLogger.ts)
- [Error Handler Service](../src/shared/services/errorHandler.ts)
