/**
 * Promo Code Types
 *
 * Types for managing promotional discount codes.
 * Codes can be global (work everywhere) or event-specific.
 */

export type DiscountType = 'percentage' | 'flat';

/**
 * Application scope determines which tickets a promo code applies to
 */
export type PromoCodeScope = 'all_tickets' | 'specific_groups' | 'specific_tiers' | 'disabled';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  /** Which tickets this code applies to */
  application_scope: PromoCodeScope;
  /** If true, discount applies to entire order; if false, applies per ticket */
  applies_to_order: boolean;
}

/**
 * Junction for promo codes linked to specific ticket groups
 */
export interface PromoCodeGroup {
  id: string;
  promo_code_id: string;
  ticket_group_id: string;
  created_at: string;
}

/**
 * Junction for promo codes linked to specific ticket tiers
 */
export interface PromoCodeTier {
  id: string;
  promo_code_id: string;
  ticket_tier_id: string;
  created_at: string;
}

/**
 * Promo code with computed scope information
 */
export interface PromoCodeWithScope extends PromoCode {
  /** True if code has no event linkages (works everywhere) */
  is_global: boolean;
  /** Number of events this code is linked to */
  event_count?: number;
  /** Groups this code applies to (when application_scope = 'specific_groups') */
  groups?: PromoCodeGroup[];
  /** Tiers this code applies to (when application_scope = 'specific_tiers') */
  tiers?: PromoCodeTier[];
}

/**
 * Junction table linking promo codes to specific events
 */
export interface EventPromoCode {
  id: string;
  event_id: string;
  promo_code_id: string;
  created_at: string;
}

/**
 * Event promo code with full promo code details
 */
export interface EventPromoCodeWithDetails extends EventPromoCode {
  promo_codes?: PromoCode;
}

/**
 * Input for creating a new promo code
 */
export interface CreatePromoCodeInput {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  expires_at?: string | null;
  is_active?: boolean;
  /** If provided, links code to this event (makes it event-specific) */
  event_id?: string;
  /** Which tickets this code applies to */
  application_scope?: PromoCodeScope;
  /** If true, discount applies to entire order; if false, applies per ticket */
  applies_to_order?: boolean;
  /** Group IDs for specific_groups scope */
  group_ids?: string[];
  /** Tier IDs for specific_tiers scope */
  tier_ids?: string[];
}

/**
 * Input for updating a promo code
 */
export interface UpdatePromoCodeInput {
  id: string;
  code?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  expires_at?: string | null;
  is_active?: boolean;
  /** Which tickets this code applies to */
  application_scope?: PromoCodeScope;
  /** If true, discount applies to entire order; if false, applies per ticket */
  applies_to_order?: boolean;
  /** Group IDs for specific_groups scope */
  group_ids?: string[];
  /** Tier IDs for specific_tiers scope */
  tier_ids?: string[];
}

/**
 * Input for linking a promo code to an event
 */
export interface LinkPromoCodeInput {
  event_id: string;
  promo_code_id: string;
}

/**
 * Format discount for display
 */
export function formatDiscount(type: DiscountType, value: number): string {
  if (type === 'percentage') {
    return `${value}%`;
  }
  // Flat discount in cents, convert to dollars
  return `$${(value / 100).toFixed(2)}`;
}

/**
 * Check if promo code is expired
 */
export function isPromoCodeExpired(code: PromoCode): boolean {
  if (!code.expires_at) return false;
  return new Date(code.expires_at) < new Date();
}

/**
 * Get promo code status
 */
export function getPromoCodeStatus(code: PromoCode): 'active' | 'inactive' | 'expired' {
  if (isPromoCodeExpired(code)) return 'expired';
  return code.is_active ? 'active' : 'inactive';
}

/**
 * Application scope options for UI
 */
export const PROMO_CODE_SCOPES: { value: PromoCodeScope; labelKey: string }[] = [
  { value: 'all_tickets', labelKey: 'promoCodes.scope.allTickets' },
  { value: 'specific_groups', labelKey: 'promoCodes.scope.specificGroups' },
  { value: 'specific_tiers', labelKey: 'promoCodes.scope.specificTiers' },
  { value: 'disabled', labelKey: 'promoCodes.scope.disabled' },
];

/**
 * Check if a promo code is effectively disabled
 * (either explicitly disabled scope or marked inactive)
 */
export function isPromoCodeDisabled(code: PromoCode): boolean {
  return code.application_scope === 'disabled' || !code.is_active;
}
