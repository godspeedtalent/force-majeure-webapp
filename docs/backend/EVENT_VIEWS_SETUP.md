# Event Views Tracking Setup

## Overview

Real-time page view tracking system for event detail pages.

## Database Migration

Run the migration to create the `event_views` table:

```bash
# Apply the migration
npx supabase db push
```

The migration creates:

- `event_views` table with columns for tracking views
- Functions for recording and counting views
- RLS policies for secure access
- Indexes for performance

## Usage

### In Components

```tsx
import { useEventViews } from '@/shared/hooks/useEventViews';

function EventComponent({ eventId }: { eventId: string }) {
  const { viewCount, recordView } = useEventViews(eventId);

  useEffect(() => {
    // Record the view when component mounts
    recordView();
  }, [recordView]);

  return <div>{viewCount.toLocaleString()} page views</div>;
}
```

## Features

- ✅ Automatic view tracking on page load
- ✅ Session-based deduplication (prevents double-counting)
- ✅ Real-time count updates
- ✅ Works for both authenticated and anonymous users
- ✅ Admin-only deletion policies
- ✅ Captures user agent and session info

## Type Generation

After running the migration, regenerate Supabase types:

```bash
npx supabase gen types typescript --local > src/shared/api/supabase/types.ts
```

## Note

The hook uses `as any` type casting temporarily until types are regenerated. This is safe and will be type-safe after running the type generation command.
