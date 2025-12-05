# Ticketing Gate Implementation

## Overview

Created a dedicated ticketing page with concurrency control (gate/queue system) to limit the number of simultaneous users purchasing tickets for an event.

## What Was Built

### 1. Dedicated Ticketing Page
**File**: `src/pages/event/EventTicketingPage.tsx`

- Full-page ticketing experience using `Layout` component
- Replicates `EventCheckoutWizard` functionality
- Shows event details (date, time, venue) at the top
- Integrates with the ticketing gate/queue system
- Three states:
  - **Loading**: Checking availability
  - **Queue**: User is waiting for access
  - **Active**: User can purchase tickets

### 2. Ticketing Gate Hook
**File**: `src/pages/event/hooks/useTicketingGate.ts`

Manages concurrent access to ticketing:
- **Session Tracking**: Creates unique browser sessions
- **Queue Management**: Automatically queues users when limit is reached
- **Position Tracking**: Shows user's position in queue
- **Auto-Promotion**: Promotes waiting users when spots open
- **Auto-Cleanup**: Removes sessions older than 30 minutes
- **Real-time Updates**: Polls every 3 seconds while in queue

Key Features:
- `enterGate()`: Attempt to enter ticketing (returns true if successful)
- `exitGate()`: Clean up session and promote next user
- `checkGateStatus()`: Check current queue position and access
- Configurable max concurrent users (default: 50)

### 3. Database Table
**File**: `supabase/migrations/20251108000002_create_ticketing_sessions_table.sql`

New `ticketing_sessions` table:
```sql
- id: UUID (primary key)
- event_id: UUID (foreign key to events)
- user_session_id: TEXT (unique browser session)
- status: TEXT ('active', 'waiting', 'completed')
- entered_at: TIMESTAMPTZ (when user gained access)
- created_at: TIMESTAMPTZ (when session was created)
- updated_at: TIMESTAMPTZ (last update)
```

Includes:
- Row Level Security (RLS) policies
- Indexes for performance
- Cleanup function for old sessions
- Unique constraint to prevent duplicate sessions

### 4. Route Configuration
**Files**: `src/config/routes.ts`, `src/App.tsx`

- Added route: `/event/:id/tickets`
- Breadcrumb label: "Tickets"
- Integrated into main app routing

### 5. Event Details Navigation
**File**: `src/pages/event/EventDetailsContent.tsx`

- "Get Tickets" button now navigates to `/event/:id/tickets`
- Removed inline checkout wizard
- Cleaner, focused event details page

## How It Works

### User Flow

1. **User clicks "Get Tickets"** on event details page
2. **Navigates to** `/event/:id/tickets`
3. **Hook attempts entry** via `enterGate()`
4. **Check capacity**:
   - If < 50 active sessions: **Grant immediate access**
   - If ≥ 50 active sessions: **Add to queue**

5. **If queued**:
   - Show queue position and wait count
   - Poll every 3 seconds for updates
   - Auto-promoted when space opens

6. **If active**:
   - Show full ticketing interface
   - User can select tickets and checkout
   - Session tracked until page close

7. **On exit** (page close/navigation):
   - Session marked as `completed`
   - Next queued user promoted to `active`

### Concurrency Control

The gate ensures only N users (default 50) can actively purchase tickets at once:

```typescript
const MAX_CONCURRENT_VIEWERS = 50;

// In useTicketingGate hook:
const { canAccess, queuePosition, waitingCount, activeCount } = 
  useTicketingGate(eventId, MAX_CONCURRENT_VIEWERS);
```

- **Active Count**: Current users purchasing tickets
- **Waiting Count**: Users in queue
- **Queue Position**: User's place in line (null if active)
- **Can Access**: Boolean - true if user can purchase

### Session Management

Sessions are browser-based (not auth-based) to support anonymous users:

```typescript
const sessionId = `session-${Date.now()}-${Math.random()}`;
```

- Created on first access attempt
- Stored in component state (not persisted)
- Cleaned up after 30 minutes of inactivity
- Prevents abuse via unique constraint

## Configuration

### Adjust Max Concurrent Users

Edit `src/pages/event/EventTicketingPage.tsx`:

```typescript
const MAX_CONCURRENT_VIEWERS = 100; // Change to desired limit
```

### Adjust Polling Interval

Edit `src/pages/event/hooks/useTicketingGate.ts`:

```typescript
// Poll every 5 seconds instead of 3
pollingIntervalRef.current = setInterval(() => {
  checkGateStatus();
}, 5000); // Changed from 3000
```

### Adjust Session Timeout

Edit the migration or cleanup function:

```typescript
const thirtyMinutesAgo = new Date(
  Date.now() - 60 * 60 * 1000 // Change to 60 minutes
).toISOString();
```

## Database Migration

To apply the migration:

```bash
# Using Supabase CLI
supabase db push

# Or via SQL in Supabase dashboard
# Copy contents of:
# supabase/migrations/20251108000002_create_ticketing_sessions_table.sql
```

## Design System Compliance

- ✅ Uses `Layout` component (navigation + topography)
- ✅ Sharp corners (`rounded-none` on cards)
- ✅ FM design system colors (fm-gold, fm-danger)
- ✅ 5px spacing scale (20px, 40px gaps)
- ✅ Canela font throughout
- ✅ Sentence case headers ("You're in the queue.")
- ✅ Frosted glass depth system for cards

## Future Enhancements

1. **Virtual Queue Numbers**: Display estimated wait time
2. **Email Notifications**: Alert users when their turn arrives
3. **Event-Specific Limits**: Different limits per event
4. **Analytics Dashboard**: Track queue metrics
5. **Priority Access**: Allow VIP/early bird queue jumping
6. **Session Persistence**: Save sessions in localStorage
7. **Multi-Tab Detection**: Warn users opening multiple tabs
8. **Grace Period**: Give users extra time if they go idle

## Testing

### Manual Testing Steps

1. Open event details page
2. Click "Get Tickets"
3. Verify navigation to `/event/:id/tickets`
4. Check that ticketing interface loads
5. Open 50+ tabs to same ticketing page
6. Verify queuing behavior after limit
7. Close an active tab
8. Verify next queued tab gets promoted

### Database Verification

```sql
-- Check active sessions
SELECT * FROM ticketing_sessions 
WHERE status = 'active' 
ORDER BY entered_at DESC;

-- Check queue
SELECT * FROM ticketing_sessions 
WHERE status = 'waiting' 
ORDER BY created_at ASC;

-- Count by status
SELECT status, COUNT(*) 
FROM ticketing_sessions 
GROUP BY status;
```

## Notes

- Sessions are **not** tied to user accounts (works for anonymous users)
- Queue position updates every **3 seconds** (not real-time)
- Old sessions auto-cleanup every **5 minutes**
- Max concurrent limit is **per-event** (different events have separate limits)
- The gate is **soft** (no hard blocking at API level yet)

## Related Files

- `src/pages/event/EventTicketingPage.tsx` - Main ticketing page
- `src/pages/event/hooks/useTicketingGate.ts` - Concurrency control hook
- `src/pages/event/EventDetailsContent.tsx` - Updated navigation
- `src/shared/api/supabase/types.ts` - Added ticketing_sessions type
- `supabase/migrations/20251108000002_create_ticketing_sessions_table.sql` - Database schema
- `src/config/routes.ts` - Route configuration
- `src/App.tsx` - Route registration
