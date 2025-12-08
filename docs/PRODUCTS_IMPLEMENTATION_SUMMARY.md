# Products & Line Items Implementation Summary

## Overview

Implemented industry-standard e-commerce schema for tracking order line items, supporting both tickets and products (ticket protection, merchandise, etc.).

## Changes Made

### 1. Database Schema (`/supabase/migrations/20251127000000_add_products_and_improve_order_items.sql`)

#### New `products` Table
```sql
- id (UUID, primary key)
- name (text) - Product name
- description (text, nullable)
- type (enum) - ticket_protection | merchandise | parking | vip_upgrade | service_fee | other
- price_cents (integer) - Price in cents
- is_active (boolean) - Whether product is available for purchase
- metadata (jsonb) - Flexible data storage
- created_at, updated_at (timestamps)
```

**Default Product Created:**
- Ticket Protection: $5.00 (ID: `00000000-0000-0000-0000-000000000001`)

#### Modified `order_items` Table
```sql
-- NEW COLUMNS:
- item_type (text) - 'ticket' or 'product'
- product_id (UUID, nullable) - References products table (when item_type='product')

-- MODIFIED:
- ticket_tier_id - Now nullable (only required when item_type='ticket')

-- CONSTRAINT:
- ticket items MUST have ticket_tier_id
- product items MUST have product_id
```

#### Modified `tickets` Table
```sql
-- NEW COLUMN:
- has_protection (boolean) - Whether ticket has protection coverage
```

### 2. Edge Functions

#### `/supabase/functions/create-checkout-session/index.ts`

**Updated Request Interface:**
```typescript
interface CheckoutItem {
  type: 'ticket' | 'product';
  ticketTierId?: string; // Required if type='ticket'
  productId?: string; // Required if type='product'
  quantity: number;
}
```

**Key Changes:**
- Validates both ticket tiers and products
- Creates separate Stripe line items for each
- Stores both types as order_items with proper type discrimination
- Products have no fees (all-inclusive pricing)

#### `/supabase/functions/handle-stripe-webhook/index.ts`

**Key Changes:**
- Checks if order contains ticket protection product
- Only processes `item_type='ticket'` for ticket creation
- Sets `has_protection=true` on all tickets if protection was purchased
- Skips product line items (they don't create physical deliverables)

### 3. TypeScript Types (`/src/features/products/types/index.ts`)

**New Types:**
```typescript
export type ProductType = 'ticket_protection' | 'merchandise' | 'parking' | 'vip_upgrade' | 'service_fee' | 'other';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  price_cents: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type OrderItemType = 'ticket' | 'product';

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: OrderItemType;
  ticket_tier_id: string | null;  // Only when item_type='ticket'
  product_id: string | null;       // Only when item_type='product'
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents: number;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  fee_breakdown: Record<string, any>;
  created_at: string;
}

export const PRODUCT_IDS = {
  TICKET_PROTECTION: '00000000-0000-0000-0000-000000000001',
} as const;
```

## How It Works

### Customer Purchases: 2 GA Tickets + 2 Ticket Protections

**Request to create-checkout-session:**
```json
{
  "eventId": "event-123",
  "items": [
    {
      "type": "ticket",
      "ticketTierId": "ga-tier-id",
      "quantity": 2
    },
    {
      "type": "product",
      "productId": "00000000-0000-0000-0000-000000000001",
      "quantity": 2
    }
  ]
}
```

**order_items Created:**
| item_type | ticket_tier_id | product_id | quantity | unit_price | unit_fee | total |
|-----------|----------------|------------|----------|------------|----------|-------|
| ticket    | ga-tier-id     | null       | 2        | 5000       | 250      | 10500 |
| product   | null           | protection-id | 2     | 500        | 0        | 1000  |

**tickets Created (after payment):**
| id | has_protection | qr_code | status |
|----|----------------|---------|--------|
| ticket-1 | true | TICKET-... | valid |
| ticket-2 | true | TICKET-... | valid |

## Benefits

✅ **Clean Receipts** - Line items match what customer purchased
✅ **Easy Refunds** - Delete protection order_item, update tickets
✅ **Simple Reporting** - `SELECT SUM(total) FROM order_items WHERE item_type='product'`
✅ **Extensible** - Easy to add merchandise, parking, VIP upgrades
✅ **Industry Standard** - Matches Shopify, Stripe, WooCommerce patterns

## Migration Status

⚠️ **Migration created but not yet applied** - There's a blocking error in an older migration (`20251124210000_update_events_schema.sql`) that prevents database reset.

### To Apply:

1. Fix the broken migration in `20251124210000_update_events_schema.sql`
2. Run `npx supabase db reset --local`
3. Verify with: Check for `products` table and new columns in `order_items`

## Frontend Integration Needed

### Next Steps:

1. **Update checkout cart** to support adding products
2. **Add ticket protection toggle** in checkout flow
3. **Update order display** to show both tickets and products
4. **Update ticket display** to show protection badge
5. **Create product management UI** for admins

### Example: Adding Protection to Cart

```typescript
import { PRODUCT_IDS } from '@/features/products/types';

// When user checks "Add Ticket Protection"
const checkoutItems = [
  {
    type: 'ticket' as const,
    ticketTierId: selectedTier.id,
    quantity: ticketQuantity,
  },
  // If protection enabled:
  ...(hasProtection ? [{
    type: 'product' as const,
    productId: PRODUCT_IDS.TICKET_PROTECTION,
    quantity: ticketQuantity, // Same as tickets
  }] : [])
];
```

## Testing

### Manual Test Flow:

1. Create event with ticket tiers
2. Add tickets to cart
3. Enable ticket protection
4. Complete checkout
5. Verify `order_items` has both ticket and product rows
6. Verify `tickets` have `has_protection=true`
7. Check receipt shows both line items

## Database Schema Diagram

```
orders (1 order)
  ├─ order_items (line items - what appears on receipt)
  │    ├─ Row: type='ticket', ticket_tier_id='GA', quantity=2, total=$105
  │    └─ Row: type='product', product_id='protection', quantity=2, total=$10
  └─ tickets (individual ticket instances with QR codes)
       ├─ Ticket #1: has_protection=true, qr_code='TICKET-ABC'
       └─ Ticket #2: has_protection=true, qr_code='TICKET-XYZ'
```

## Files Modified

1. `/supabase/migrations/20251127000000_add_products_and_improve_order_items.sql` (NEW)
2. `/supabase/functions/create-checkout-session/index.ts` (UPDATED)
3. `/supabase/functions/handle-stripe-webhook/index.ts` (UPDATED)
4. `/src/features/products/types/index.ts` (NEW)
5. `/src/components/common/feedback/FmCommonLoadingSpinner.tsx` (UPDATED - logo spinner)
6. `/src/components/layout/EventDetailsLayout.tsx` (UPDATED - z-index layers)
7. `/src/pages/event/EventDetailsPage.tsx` (UPDATED - logo spinner)
8. `/src/pages/event/EventDetailsContent.tsx` (UPDATED - removed duplicate topography)
