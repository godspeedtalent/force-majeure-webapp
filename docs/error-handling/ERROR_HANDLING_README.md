# Error Handling System

> **📖 Full Documentation:** See [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) for complete API reference and patterns.

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

## Key Features

- **Centralized**: Single `handleError()` function for all errors
- **Role-Aware**: Developers see detailed debugging info, users see friendly messages
- **Copyable**: Click to copy full error details and stack traces
- **Auto-Logged**: Errors automatically logged to backend
- **Consistent UX**: Unified toast styling across the app

## What to Use

| Function | Use Case |
|----------|----------|
| `handleError()` | Standard error handling with toast |
| `withErrorHandler()` | Wrap async operations |
| `withErrorHandlerSync()` | Wrap synchronous operations |

## See Also

- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Complete API reference
- [examples/ERROR_HANDLER_MIGRATION.md](./examples/ERROR_HANDLER_MIGRATION.md) - Migration examples
