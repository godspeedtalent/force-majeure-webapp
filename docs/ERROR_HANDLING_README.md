# Centralized Error Handling System

## Overview

The Force Majeure webapp now has a centralized error handling system that provides:

- ✅ **Consistent error handling** across the entire application
- ✅ **Role-aware displays** - developers/admins see detailed debugging info
- ✅ **Copyable error details** including response bodies and stack traces
- ✅ **Automatic logging** to backend for monitoring
- ✅ **User-friendly messages** for regular users
- ✅ **Visual feedback** with enhanced error toasts

## Quick Start

```typescript
import { handleError } from '@/shared/services/errorHandler';

try {
  await supabase.from('events').insert(eventData);
} catch (error) {
  handleError(error, {
    title: 'Failed to Create Event',
    description: 'Could not save the event',
  });
}
```

## What Users See

### Regular Users
- **Title**: "Failed to Create Event" (crimson text)
- **Message**: "An error occurred. Please try again."
- **Duration**: 4 seconds
- **No technical details**

### Developers/Admins
- **Title**: "Failed to Create Event" (crimson text)
- **Full Description**: Including user-friendly message
- **Response Body**: Formatted JSON with error details
- **Error Message**: In monospace font
- **Copy Button**: Copies full error including stack trace
- **Duration**: 8 seconds (more time to read/copy)

## Features

### 1. Centralized Error Handler

Single function handles all error types:
- Standard Error objects
- Supabase/PostgrestError
- HTTP Response errors
- String errors
- Unknown error types

### 2. Automatic Role Detection

Detects if user is developer/admin and shows appropriate content:

```typescript
// Auto-detects from localStorage
handleError(error, { title: 'Failed' });

// Or specify explicitly
handleError(error, { 
  title: 'Failed',
  userRole: 'admin' // Shows detailed error
});
```

### 3. Copyable Error Details

Developers can click copy button to get:
```
Title: Failed to Create Event
Description: Could not save the event to the database

Message: duplicate key value violates unique constraint
Status: 409
Details: {
  "code": "23505",
  "details": "Key (id)=(123) already exists."
}

Stack Trace:
Error: duplicate key value...
    at create (EventManagement.tsx:145)
    ...
```

### 4. Automatic Backend Logging

All errors are automatically logged to backend via edge function:
- Error level, source, endpoint, method
- Error message and details
- Stack traces for debugging
- User agent and IP (when available)

### 5. Silent Errors

For background operations, disable toast:

```typescript
handleError(error, {
  title: 'Failed to Load Stats',
  showToast: false, // No toast shown
  logError: true,   // Still logged to backend
});
```

## Files Created

### Core Service
- **`src/shared/services/errorHandler.ts`** - Main error handler service
  - `handleError()` - Main error handler function
  - `withErrorHandler()` - Async wrapper
  - `withErrorHandlerSync()` - Sync wrapper

### Enhanced Components
- **`src/components/common/feedback/FmErrorToast.tsx`** - Enhanced error toast
  - Better formatting for response bodies
  - Copyable content
  - Role-aware display

### Documentation
- **`docs/ERROR_HANDLING_GUIDE.md`** - Complete API reference and patterns
- **`docs/examples/ERROR_HANDLER_MIGRATION.md`** - Migration examples

### Updated Files
- `src/components/search/GlobalSearch.tsx`
- `src/pages/Profile.tsx`
- `src/pages/EventManagement.tsx`
- `src/shared/services/index.ts` - Exports error handler functions

## Usage Patterns

### Basic API Call
```typescript
try {
  const { data, error } = await supabase
    .from('events')
    .select('*');
  if (error) throw error;
  return data;
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Events',
    endpoint: 'events',
    method: 'SELECT',
  });
}
```

### With Wrapper
```typescript
const event = await withErrorHandler(
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
  }
);
// event is null if error occurred
```

### Network Requests
```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
} catch (error) {
  await handleError(error, {
    title: 'Network Request Failed',
    endpoint: '/api/data',
    method: 'GET',
  });
}
```

### Silent Background Operations
```typescript
try {
  await fetchUserStats();
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Stats',
    showToast: false, // Silent
  });
}
```

## Migration Guide

To migrate existing error handling:

1. **Add import**:
   ```typescript
   import { handleError } from '@/shared/services/errorHandler';
   ```

2. **Replace old pattern**:
   ```typescript
   // OLD ❌
   } catch (error) {
     console.error('Error:', error);
     await logApiError({...});
     toast.error('Failed');
   }
   
   // NEW ✅
   } catch (error) {
     await handleError(error, {
       title: 'Failed to Save',
       endpoint: 'events',
       method: 'UPDATE',
     });
   }
   ```

3. **Remove old imports**:
   - `import { logApiError } from '@/shared/utils/apiLogger';`
   - Manual `toast.error()` calls

See [ERROR_HANDLER_MIGRATION.md](./examples/ERROR_HANDLER_MIGRATION.md) for complete examples.

## Benefits

| Before | After |
|--------|-------|
| Multiple imports needed | Single import |
| Manual error logging | Automatic logging |
| Generic error messages | Contextual messages |
| Same for all users | Role-aware content |
| No debugging info | Full stack traces |
| Can't copy errors | Click to copy |
| Inconsistent UX | Consistent toasts |
| More boilerplate | Less code |

## Best Practices

### ✅ DO
- Use `handleError()` for all user-facing errors
- Provide clear, descriptive titles
- Include `endpoint` and `method` for API calls
- Use `showToast: false` for background ops
- Add context about what was being done

### ❌ DON'T
- Don't use multiple error handling patterns
- Don't show technical jargon in titles
- Don't forget to `await handleError()` (it's async)
- Don't manually call `toast.error()` anymore
- Don't duplicate error logging (it's automatic)

## Examples from Codebase

### GlobalSearch Component
```typescript
// src/components/search/GlobalSearch.tsx
try {
  const results = await Promise.all([...]);
  setResults(results);
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
  const { data, error } = await supabase
    .from('orders')
    .select('event_id');
  if (error) throw error;
  // Process...
} catch (error) {
  await handleError(error, {
    title: 'Failed to Load Stats',
    showToast: false, // Silent for stats
  });
}
```

### Event Management
```typescript
// src/pages/EventManagement.tsx
try {
  await supabase.from('events').update(data).eq('id', id);
  toast.success('Event updated');
} catch (error) {
  await handleError(error, {
    title: 'Failed to Update Event',
    description: 'Could not save event changes',
    endpoint: 'EventManagement',
    method: 'UPDATE',
  });
}
```

## See Also

- [Complete Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- [Migration Examples](./examples/ERROR_HANDLER_MIGRATION.md)
- [Error Toast Examples](./examples/ERROR_TOAST_EXAMPLES.tsx)
