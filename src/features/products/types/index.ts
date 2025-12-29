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

/**
 * Merch-specific category type
 */
export type MerchCategory =
  | 'apparel'
  | 'prints'
  | 'stickers'
  | 'accessories'
  | 'vinyl'
  | 'digital'
  | 'collectibles'
  | 'other';

/**
 * Stock status for inventory display
 */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unlimited';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  price_cents: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Extended Product interface for merch store items
 * Includes inventory tracking and merch-specific fields
 */
export interface MerchProduct extends Product {
  // Inventory tracking
  stock_quantity: number | null;
  track_inventory: boolean;
  low_stock_threshold: number;
  allow_backorder: boolean;
  // Merch-specific fields
  image_url: string | null;
  category: MerchCategory | null;
  sku: string | null;
  sort_order: number;
}

export interface ProductInsert {
  id?: string;
  name: string;
  description?: string | null;
  type: ProductType;
  price_cents: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MerchProductInsert extends ProductInsert {
  stock_quantity?: number | null;
  track_inventory?: boolean;
  low_stock_threshold?: number;
  allow_backorder?: boolean;
  image_url?: string | null;
  category?: MerchCategory | null;
  sku?: string | null;
  sort_order?: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string | null;
  type?: ProductType;
  price_cents?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MerchProductUpdate extends ProductUpdate {
  stock_quantity?: number | null;
  track_inventory?: boolean;
  low_stock_threshold?: number;
  allow_backorder?: boolean;
  image_url?: string | null;
  category?: MerchCategory | null;
  sku?: string | null;
  sort_order?: number;
}

/**
 * Get stock status for a merch product
 */
export function getStockStatus(product: MerchProduct): StockStatus {
  if (!product.track_inventory) return 'unlimited';
  if (product.stock_quantity === null || product.stock_quantity <= 0) return 'out_of_stock';
  if (product.stock_quantity <= product.low_stock_threshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Check if a product can be purchased
 */
export function canPurchase(product: MerchProduct): boolean {
  if (!product.is_active) return false;
  if (!product.track_inventory) return true;
  if (product.allow_backorder) return true;
  return (product.stock_quantity ?? 0) > 0;
}

/**
 * Format price from cents to display string
 */
export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * Category display labels
 */
export const MERCH_CATEGORY_LABELS: Record<MerchCategory, string> = {
  apparel: 'Apparel',
  prints: 'Prints',
  stickers: 'Stickers',
  accessories: 'Accessories',
  vinyl: 'Vinyl',
  digital: 'Digital',
  collectibles: 'Collectibles',
  other: 'Other',
};

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
