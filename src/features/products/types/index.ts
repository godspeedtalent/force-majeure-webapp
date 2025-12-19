/**
 * Product Types
 * Products represent non-ticket items that can be purchased (protection, merchandise, etc.)
 */

export type ProductType =
  | 'ticket_protection'
  | 'merchandise'
  | 'parking'
  | 'vip_upgrade'
  | 'service_fee'
  | 'other';

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

export interface ProductInsert {
  id?: string;
  name: string;
  description?: string | null;
  type: ProductType;
  price_cents: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface ProductUpdate {
  name?: string;
  description?: string | null;
  type?: ProductType;
  price_cents?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Predefined Product IDs
 */
export const PRODUCT_IDS = {
  TICKET_PROTECTION: '00000000-0000-0000-0000-000000000001',
} as const;

/**
 * Order Item Types
 * Updated to support both tickets and products
 */

export type OrderItemType = 'ticket' | 'product';

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: OrderItemType;

  // References (one or the other based on item_type)
  ticket_tier_id: string | null;
  product_id: string | null;

  // Pricing
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents: number;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  fee_breakdown: Record<string, any>;

  created_at: string;
}

export interface OrderItemInsert {
  order_id: string;
  item_type: OrderItemType;
  ticket_tier_id?: string | null;
  product_id?: string | null;
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents: number;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  fee_breakdown?: Record<string, any>;
}

/**
 * Ticket Type Updates
 * Added has_protection field
 */

export interface TicketUpdate {
  has_protection?: boolean;
  attendee_name?: string;
  attendee_email?: string;
  status?: 'valid' | 'used' | 'refunded' | 'cancelled';
}
