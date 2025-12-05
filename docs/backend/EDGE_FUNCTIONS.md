# Supabase Edge Functions Documentation

This document describes all Edge Functions used by the Force Majeure webapp. These functions are critical for mobile app integration as they handle server-side business logic.

---

## Payment Functions

### `create-checkout-session`

Creates a Stripe Checkout Session for ticket and/or product purchases.

**Endpoint:** `POST /create-checkout-session`

**Authentication:** Required (Bearer token)

**Request Body:**

```typescript
interface CheckoutRequest {
  eventId: string;
  items: Array<{
    type: 'ticket' | 'product';
    ticketTierId?: string; // Required if type='ticket'
    productId?: string;    // Required if type='product'
    quantity: number;
  }>;
  fingerprint: string; // Device/session fingerprint for hold tracking
}
```

**Response:**

```typescript
interface CheckoutResponse {
  sessionId: string;      // Stripe session ID
  url: string;            // Stripe Checkout URL (redirect here)
  orderId: string;        // Internal order ID
  expiresAt: number;      // Unix timestamp when session expires
}
```

**Error Responses:**
- `401` - Missing or invalid authorization
- `400` - Invalid ticket tier or product, or tickets unavailable
- `500` - Payment system not configured or internal error

**Flow:**
1. Validates user authentication
2. For tickets: Validates tier, creates 10-minute hold, calculates fees
3. For products: Validates product, no fees applied
4. Creates order record (status: 'pending')
5. Creates order_items records
6. Creates Stripe Checkout Session (10-minute expiry)
7. Returns session details for redirect

---

### `create-payment-intent`

Creates a Stripe PaymentIntent for direct card payments.

**Endpoint:** `POST /create-payment-intent`

**Authentication:** Required (Bearer token)

**Request Body:**

```typescript
interface PaymentIntentRequest {
  amount: number;           // Amount in cents
  currency?: string;        // 'usd', 'eur', 'gbp' (default: 'usd')
  customerId: string;       // Stripe customer ID (cus_xxx)
  paymentMethodId?: string; // Optional: attach and confirm immediately
}
```

**Response:**

```typescript
interface PaymentIntentResponse {
  clientSecret: string;     // For Stripe.js confirmPayment()
  paymentIntentId: string;  // Stripe PaymentIntent ID
}
```

**Error Responses:**
- `401` - Unauthorized
- `400` - Invalid amount, currency, or customer ID
- `403` - Customer ID doesn't belong to user
- `500` - Internal error

---

### `handle-stripe-webhook`

Handles Stripe webhook events for payment completion.

**Endpoint:** `POST /handle-stripe-webhook`

**Authentication:** Stripe signature verification

**Handled Events:**
- `checkout.session.completed` - Marks order as completed, creates tickets
- `payment_intent.succeeded` - Updates order status
- `payment_intent.payment_failed` - Marks order as failed, releases holds

---

### `get-stripe-customer`

Gets or creates a Stripe customer for the authenticated user.

**Endpoint:** `GET /get-stripe-customer`

**Authentication:** Required (Bearer token)

**Response:**

```typescript
interface CustomerResponse {
  customerId: string;       // Stripe customer ID
  email: string;
}
```

---

### `list-payment-methods`

Lists saved payment methods for a customer.

**Endpoint:** `GET /list-payment-methods`

**Authentication:** Required (Bearer token)

**Response:**

```typescript
interface PaymentMethodsResponse {
  paymentMethods: Array<{
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  }>;
}
```

---

### `attach-payment-method` / `detach-payment-method`

Attach or detach a payment method from a customer.

**Endpoint:** `POST /attach-payment-method` or `POST /detach-payment-method`

**Authentication:** Required (Bearer token)

**Request Body:**

```typescript
interface PaymentMethodRequest {
  paymentMethodId: string;
}
```

---

## Ticket Functions

### `validate-ticket`

Validates QR codes at venue entrances. Critical for mobile ticket scanning.

**Endpoint:** `POST /validate-ticket`

**Authentication:** Required (Bearer token with `scan_tickets` permission or admin/developer role)

**Request Body:**

```typescript
interface ValidateTicketRequest {
  qr_data: string;          // Raw QR code data
  scanner_user_id?: string; // Optional override
  device_info?: {
    userAgent?: string;
    platform?: string;
    browser?: string;
  };
  scan_location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
  };
}
```

**Response:**

```typescript
interface ValidateTicketResponse {
  valid: boolean;
  ticket?: {
    id: string;
    event_id: string;
    ticket_tier_name: string;
    attendee_name: string | null;
    attendee_email: string | null;
    event_name: string;
    event_start_time: string;
    venue_name: string;
    checked_in_at: string;
  };
  error?: string;
  reason?: 'invalid_qr' | 'already_used' | 'refunded' | 'cancelled' | 'not_found' | 'permission_denied' | 'event_mismatch';
}
```

**Flow:**
1. Validates user has `scan_tickets` permission or admin/developer role
2. Verifies QR code signature
3. Fetches ticket from database
4. Checks event matches
5. Checks ticket status (valid/used/refunded/cancelled)
6. If valid: Updates to 'used', records check-in time
7. Logs scan event to audit table

**Mobile Considerations:**
- Always returns 200 with `valid: boolean` - handle scan result in app
- Include device_info and scan_location for audit logging
- Consider offline mode: pre-download valid ticket IDs, queue scans for sync

---

## Email Functions

### `send-email`

Generic email sending function.

**Endpoint:** `POST /send-email`

**Authentication:** Required (service role or admin)

**Request Body:**

```typescript
interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}
```

---

### `send-order-receipt-email`

Sends order confirmation email with ticket details.

**Endpoint:** `POST /send-order-receipt-email`

**Authentication:** Required (Bearer token)

**Request Body:**

```typescript
interface ReceiptEmailRequest {
  orderId: string;
}
```

---

## Reporting Functions

### `generate-sales-report`

Generates sales report for an event or date range.

**Endpoint:** `POST /generate-sales-report`

**Authentication:** Required (admin or `manage_events` permission)

**Request Body:**

```typescript
interface ReportRequest {
  eventId?: string;
  dateFrom?: string;
  dateTo?: string;
  format?: 'json' | 'csv';
}
```

---

## User Management Functions

### `get-users`

Lists users with optional filtering (admin only).

**Endpoint:** `GET /get-users`

**Authentication:** Required (admin role)

**Query Parameters:**
- `search` - Search by email or name
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

---

## Scavenger Hunt Functions

### `generate-scavenger-tokens`

Generates QR tokens for scavenger hunt locations.

**Endpoint:** `POST /generate-scavenger-tokens`

**Authentication:** Required (admin role)

---

### `validate-scavenger-token`

Validates a scanned scavenger hunt token.

**Endpoint:** `POST /validate-scavenger-token`

**Authentication:** Required (Bearer token)

---

### `claim-scavenger-reward`

Claims reward after completing scavenger hunt.

**Endpoint:** `POST /claim-scavenger-reward`

**Authentication:** Required (Bearer token)

---

### `validate-location`

Validates user location for geo-fenced features.

**Endpoint:** `POST /validate-location`

**Authentication:** Required (Bearer token)

---

## Utility Functions

### `log-error`

Logs client-side errors to server for debugging.

**Endpoint:** `POST /log-error`

**Authentication:** Optional

**Request Body:**

```typescript
interface ErrorLogRequest {
  message: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
}
```

---

### `track-link`

Tracks link clicks for analytics.

**Endpoint:** `GET /track-link`

**Query Parameters:**
- `url` - Destination URL
- `source` - Traffic source identifier

---

### `secure-tokens`

Generates secure tokens for various purposes.

**Endpoint:** `POST /secure-tokens`

**Authentication:** Required (admin role)

---

### `generate-dev-tokens`

Generates development/test tokens (dev environment only).

**Endpoint:** `POST /generate-dev-tokens`

**Authentication:** Required (developer role)

---

## Mobile App Integration Notes

### Authentication

All authenticated endpoints expect:
```
Authorization: Bearer <supabase_access_token>
```

Get the token from Supabase auth:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### CORS

All functions include CORS headers for cross-origin requests.

### Critical Functions for Mobile

1. **Ticket Purchasing:** `create-checkout-session`
2. **Ticket Scanning:** `validate-ticket`
3. **Payment Management:** `list-payment-methods`, `attach-payment-method`
4. **User Data:** `get-stripe-customer`

### Offline Considerations

For ticket scanning in offline mode:
1. Pre-download event's valid ticket IDs before event
2. Validate against local list
3. Queue scan records with timestamps
4. Sync when connection restored
5. Handle conflicts (ticket used elsewhere)

### Error Handling

All functions return JSON with consistent error structure:
```typescript
interface ErrorResponse {
  error: string;
  reason?: string;
  request_id?: string;
}
```
