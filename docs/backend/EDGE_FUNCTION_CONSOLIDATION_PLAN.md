# Edge Function Consolidation Plan (Option A)

**Status**: Planning - Not Yet Implemented
**Created**: 2026-01-22
**Strategy**: Feature-Based Grouping with Shared Utilities

---

## Executive Summary

Consolidate 27 separate edge functions into ~10 feature-grouped functions with shared utilities. This reduces deployment overhead, eliminates code duplication, and improves maintainability.

**Impact**:
- Reduce function count by ~60% (27 → 10)
- Eliminate ~200+ lines of duplicated auth/CORS code
- Centralize validation and error handling
- Improve developer experience with co-located feature code

---

## Current State

### Existing Functions (27 total)

**Payments (5 functions):**
- `create-payment-intent`
- `attach-payment-method`
- `detach-payment-method`
- `get-stripe-customer`
- `list-payment-methods`

**Email (3 functions):**
- `send-email`
- `send-contact-email`
- `send-order-receipt-email`

**Scavenger Hunt (3 functions):**
- `generate-scavenger-tokens`
- `validate-scavenger-token`
- `claim-scavenger-reward`

**Comp Tickets (2 functions):**
- `issue-comp-ticket`
- `claim-comp-ticket`

**Ticketing (2 functions):**
- `validate-ticket`
- `validate-location`

**User Management (2 functions):**
- `get-users`
- `delete-user`

**Utilities (5 functions):**
- `generate-dev-tokens`
- `secure-tokens`
- `log-error`
- `track-link`
- `generate-sales-report`

**Webhooks (2 functions):**
- `handle-stripe-webhook`
- `spotify-api`

**Shared (_shared folder):**
- `cors.ts`
- `activityLogger.ts`
- `qr.ts`

---

## Target State

### Consolidated Functions (10 total)

```
supabase/functions/
├── _shared/                    # Expanded shared utilities
│   ├── auth.ts                # NEW: Authentication & authorization
│   ├── cors.ts                # EXISTS: CORS utilities
│   ├── responses.ts           # NEW: Standard response helpers
│   ├── validation.ts          # NEW: Zod schemas for input validation
│   ├── database.ts            # NEW: Common database queries
│   ├── types.ts               # NEW: Shared TypeScript types
│   ├── activityLogger.ts      # EXISTS: Activity logging
│   └── qr.ts                  # EXISTS: QR code generation
│
├── screening/                  # NEW: Artist screening operations
│   ├── index.ts               # Route dispatcher
│   ├── handlers/
│   │   ├── getSubmissions.ts
│   │   ├── getStats.ts
│   │   ├── getRankings.ts
│   │   ├── createReview.ts
│   │   ├── makeDecision.ts
│   │   └── updateConfig.ts
│   ├── utils/
│   │   ├── scoring.ts
│   │   └── notifications.ts
│   └── types.ts
│
├── payments/                   # CONSOLIDATE: 5 functions → 1
│   ├── index.ts               # Route dispatcher
│   └── handlers/
│       ├── createIntent.ts
│       ├── attachMethod.ts
│       ├── detachMethod.ts
│       ├── getCustomer.ts
│       └── listMethods.ts
│
├── email/                      # CONSOLIDATE: 3 functions → 1
│   ├── index.ts               # Route dispatcher
│   ├── handlers/
│   │   ├── send.ts
│   │   ├── sendContact.ts
│   │   └── sendOrderReceipt.ts
│   └── templates/
│       ├── contact.html
│       └── orderReceipt.html
│
├── scavenger/                  # CONSOLIDATE: 3 functions → 1
│   ├── index.ts               # Route dispatcher
│   └── handlers/
│       ├── generateTokens.ts
│       ├── validateToken.ts
│       └── claimReward.ts
│
├── ticketing/                  # CONSOLIDATE: 4 functions → 1
│   ├── index.ts               # Route dispatcher
│   └── handlers/
│       ├── validateTicket.ts
│       ├── validateLocation.ts
│       ├── issueComp.ts
│       └── claimComp.ts
│
├── users/                      # CONSOLIDATE: 2 functions → 1
│   ├── index.ts
│   └── handlers/
│       ├── getUsers.ts
│       └── deleteUser.ts
│
├── utilities/                  # CONSOLIDATE: 5 functions → 1
│   ├── index.ts
│   └── handlers/
│       ├── generateDevTokens.ts
│       ├── secureTokens.ts
│       ├── logError.ts
│       ├── trackLink.ts
│       └── generateSalesReport.ts
│
├── handle-stripe-webhook/      # KEEP SEPARATE: Specialized webhook
│   └── index.ts
│
└── spotify-api/                # KEEP SEPARATE: External integration
    └── index.ts
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Create shared utilities without breaking changes

**Tasks**:
1. Create `_shared/auth.ts` with authentication helpers
2. Create `_shared/responses.ts` with standard response utilities
3. Create `_shared/validation.ts` with Zod schemas
4. Create `_shared/database.ts` with common DB queries
5. Create `_shared/types.ts` with shared TypeScript interfaces
6. Write unit tests for shared utilities

**Deliverables**:
- [ ] `_shared/auth.ts` (auth verification, role checking)
- [ ] `_shared/responses.ts` (success/error response helpers)
- [ ] `_shared/validation.ts` (common Zod schemas)
- [ ] `_shared/database.ts` (helper queries)
- [ ] `_shared/types.ts` (shared type definitions)
- [ ] Unit tests for all shared utilities

**Risk**: Low - No changes to existing functions

---

### Phase 2: Pilot - Artist Screening (Week 2)

**Goal**: Implement new `screening` function as proof of concept

**Tasks**:
1. Create `screening/` directory structure
2. Implement route dispatcher in `index.ts`
3. Create operation handlers (getSubmissions, getStats, etc.)
4. Create database functions for aggregations
5. Update React hooks to call screening edge function
6. Integration testing

**Deliverables**:
- [ ] `screening/index.ts` with routing
- [ ] 6 operation handlers
- [ ] Database functions for stats aggregation
- [ ] Updated React Query hooks
- [ ] Integration tests

**Success Metrics**:
- 50-70% faster stats queries
- ~80% reduction in network payload for aggregates
- Developer satisfaction with new pattern

**Risk**: Low - New feature, no migration needed

---

### Phase 3: Payments Consolidation (Week 3)

**Goal**: Consolidate 5 payment functions into 1

**Tasks**:
1. Create `payments/` directory structure
2. Implement route dispatcher
3. Migrate handlers from existing functions
4. Update client code to use new operation-based calls
5. Run parallel testing (old + new functions)
6. Deprecate old functions after validation

**Migration Strategy**:
```typescript
// OLD: Direct function call
const { data } = await supabase.functions.invoke('create-payment-intent', {
  body: { amount, currency, customerId }
});

// NEW: Operation-based call
const { data } = await supabase.functions.invoke('payments', {
  body: {
    operation: 'createIntent',
    amount,
    currency,
    customerId
  }
});
```

**Client Files to Update**:
- `src/features/payments/services/stripeService.ts`
- Any checkout flows calling payment functions

**Deliverables**:
- [ ] Consolidated `payments/` function
- [ ] Updated client code
- [ ] Parallel testing validation
- [ ] Deprecation of old functions

**Risk**: Medium - Critical payment flow, requires careful testing

---

### Phase 4: Email & Scavenger Consolidation (Week 4)

**Goal**: Consolidate email (3) and scavenger (3) functions

**Email Migration**:
- Consolidate: `send-email`, `send-contact-email`, `send-order-receipt-email`
- Client files: `src/services/email/EmailService.ts`

**Scavenger Migration**:
- Consolidate: `generate-scavenger-tokens`, `validate-scavenger-token`, `claim-scavenger-reward`
- Client files: `src/features/scavenger/*`

**Deliverables**:
- [ ] Consolidated `email/` function
- [ ] Consolidated `scavenger/` function
- [ ] Updated client code for both features
- [ ] Integration tests

**Risk**: Low - Non-critical features, easy rollback

---

### Phase 5: Ticketing & Users Consolidation (Week 5)

**Goal**: Consolidate ticketing (4) and user management (2) functions

**Ticketing Migration**:
- Consolidate: `validate-ticket`, `validate-location`, `issue-comp-ticket`, `claim-comp-ticket`
- Client files: Ticket scanning components

**Users Migration**:
- Consolidate: `get-users`, `delete-user`
- Client files: User admin grid

**Deliverables**:
- [ ] Consolidated `ticketing/` function
- [ ] Consolidated `users/` function
- [ ] Updated client code
- [ ] Integration tests

**Risk**: Medium - Ticket validation is critical for events

---

### Phase 6: Utilities & Cleanup (Week 6)

**Goal**: Consolidate remaining utilities and remove deprecated functions

**Tasks**:
1. Consolidate 5 utility functions
2. Verify all client code migrated
3. Delete deprecated individual functions
4. Update documentation
5. Performance benchmarking report

**Deliverables**:
- [ ] Consolidated `utilities/` function
- [ ] All old functions deleted
- [ ] Updated documentation
- [ ] Performance comparison report

**Risk**: Low - Final cleanup

---

## Shared Utility Specifications

### `_shared/auth.ts`

```typescript
/**
 * Verify user authentication from request
 * Returns authenticated Supabase client and user
 */
export async function verifyAuth(req: Request): Promise<{
  user: User;
  supabase: SupabaseClient;
}>;

/**
 * Require specific role for operation
 * Throws error if user doesn't have role
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  role: string
): Promise<void>;

/**
 * Require specific permission for operation
 * Throws error if user doesn't have permission
 */
export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  permission: string
): Promise<void>;

/**
 * Check if user is admin (bypasses all other checks)
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean>;
```

### `_shared/responses.ts`

```typescript
/**
 * Create successful JSON response
 */
export function createSuccessResponse(
  data: any,
  corsHeaders: Record<string, string>
): Response;

/**
 * Create error JSON response
 */
export function createErrorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>
): Response;

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: ZodError,
  corsHeaders: Record<string, string>
): Response;
```

### `_shared/validation.ts`

```typescript
import { z } from 'https://deno.land/x/zod/mod.ts';

/**
 * Validate request body against schema
 * Throws error with formatted message on failure
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T;

// Common schemas
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
```

---

## Route Dispatcher Pattern

### Standard Template

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/responses.ts';

// Import handlers
import { handlerA } from './handlers/handlerA.ts';
import { handlerB } from './handlers/handlerB.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // Verify authentication once
    const { user, supabase } = await verifyAuth(req);

    // Parse operation from request
    const { operation, ...params } = await req.json();

    // Route to handler
    let result;
    switch (operation) {
      case 'operationA':
        result = await handlerA(supabase, user, params);
        break;
      case 'operationB':
        result = await handlerB(supabase, user, params);
        break;
      default:
        return createErrorResponse(
          `Invalid operation: ${operation}`,
          400,
          corsHeaders
        );
    }

    return createSuccessResponse(result, corsHeaders);
  } catch (error) {
    console.error('Function error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500,
      corsHeaders
    );
  }
});
```

---

## Client-Side Migration Pattern

### Before (Current Pattern)

```typescript
// Direct function invocation
const { data, error } = await supabase.functions.invoke('create-payment-intent', {
  body: { amount, currency, customerId }
});
```

### After (Operation-Based Pattern)

```typescript
// Operation-based invocation
const { data, error } = await supabase.functions.invoke('payments', {
  body: {
    operation: 'createIntent',
    amount,
    currency,
    customerId
  }
});
```

### React Query Hook Pattern

```typescript
// Before
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke(
        'create-payment-intent',
        { body: params }
      );
      if (error) throw error;
      return data;
    }
  });
}

// After
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: { operation: 'createIntent', ...params }
      });
      if (error) throw error;
      return data.data; // Unwrap standardized response
    }
  });
}
```

---

## Testing Strategy

### Unit Tests (Edge Functions)

```typescript
// Test individual handlers in isolation
Deno.test('getSubmissions handler filters by status', async () => {
  const mockSupabase = createMockSupabaseClient();
  const mockUser = { id: 'user-123' };

  const result = await getSubmissions(mockSupabase, mockUser, {
    status: 'approved'
  });

  assertEquals(result.length, 5);
  assert(result.every(s => s.status === 'approved'));
});
```

### Integration Tests (Client → Edge Function)

```typescript
// Test full request flow
test('useScreeningSubmissions fetches filtered submissions', async () => {
  const { result } = renderHook(() => useScreeningSubmissions({
    status: 'pending'
  }));

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toHaveLength(3);
  expect(result.current.data[0].status).toBe('pending');
});
```

### Parallel Testing (Migration)

Run old and new functions side-by-side:

```typescript
// During migration, verify identical results
const oldResult = await supabase.functions.invoke('create-payment-intent', { body });
const newResult = await supabase.functions.invoke('payments', {
  body: { operation: 'createIntent', ...body }
});

expect(newResult.data).toEqual(oldResult.data);
```

---

## Rollback Plan

### For Each Phase

1. **Keep old functions running** during parallel testing
2. **Feature flag** to toggle between old/new implementation
3. **Monitor error rates** for 48 hours after switch
4. **Rollback procedure**: Update client code to call old functions
5. **Delete old functions** only after 1 week of stable new implementation

### Feature Flag Pattern

```typescript
// Client-side feature flag
const USE_CONSOLIDATED_FUNCTIONS =
  featureFlags.consolidated_edge_functions || false;

const invokePaymentIntent = async (params) => {
  if (USE_CONSOLIDATED_FUNCTIONS) {
    return supabase.functions.invoke('payments', {
      body: { operation: 'createIntent', ...params }
    });
  } else {
    return supabase.functions.invoke('create-payment-intent', {
      body: params
    });
  }
};
```

---

## Success Metrics

### Performance

- [ ] 50%+ reduction in edge function cold start times (fewer deployments)
- [ ] 30%+ reduction in total edge function execution time (shared auth)
- [ ] 80%+ reduction in network payload for aggregation queries

### Code Quality

- [ ] Eliminate 200+ lines of duplicated auth/CORS code
- [ ] Reduce edge function count by 60% (27 → 10)
- [ ] Centralize validation logic (single source of truth)

### Developer Experience

- [ ] Faster feature development (co-located code)
- [ ] Easier debugging (single function to inspect)
- [ ] Improved type safety (shared types)

---

## Dependencies & Prerequisites

### Required

- Supabase CLI (for local testing)
- Deno 1.37+ (for edge function runtime)
- Feature flag system (for gradual rollout)

### Optional

- Performance monitoring (track before/after metrics)
- Integration test framework (automated testing)

---

## Timeline Summary

| Phase | Duration | Functions Affected | Risk Level |
|-------|----------|-------------------|------------|
| Phase 1: Foundation | 1 week | 0 (new code) | Low |
| Phase 2: Screening | 1 week | 0 (new feature) | Low |
| Phase 3: Payments | 1 week | 5 functions | Medium |
| Phase 4: Email + Scavenger | 1 week | 6 functions | Low |
| Phase 5: Ticketing + Users | 1 week | 6 functions | Medium |
| Phase 6: Cleanup | 1 week | 10 functions | Low |
| **Total** | **6 weeks** | **27 → 10 functions** | - |

---

## Open Questions

1. **Should we consolidate utilities?** (generate-dev-tokens, log-error, etc.)
   - **Recommendation**: Yes, but low priority

2. **Keep webhooks separate?** (handle-stripe-webhook, spotify-api)
   - **Recommendation**: Yes, they have different auth patterns

3. **Database functions for aggregations?**
   - **Recommendation**: Yes, create PostgreSQL functions for complex stats

4. **Versioning strategy?**
   - **Recommendation**: Use operation names, avoid version numbers for now

---

## References

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Best Practices](https://deno.com/deploy/docs/best-practices)
- Current edge functions: `/supabase/functions/`
- Existing shared utilities: `/supabase/functions/_shared/`

---

**Next Steps**: Review plan with team, approve Phase 1 & 2, begin implementation of shared utilities.
