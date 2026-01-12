/**
 * Address Types
 *
 * Centralized type definitions for the normalized addresses system.
 * Addresses are stored in a polymorphic table that can belong to
 * profiles, guests, or organizations.
 */

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Address type enum matching the database address_type enum
 */
export type AddressType = 'billing' | 'shipping' | 'headquarters' | 'other';

/**
 * Full address record from the database
 */
export interface Address {
  id: string;
  line_1: string | null;
  line_2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  address_type: AddressType;
  label: string | null;
  is_default: boolean;
  profile_id: string | null;
  guest_id: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Address data for creating or updating (without metadata)
 */
export interface AddressFormData {
  line_1: string;
  line_2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

/**
 * Owner type for polymorphic ownership
 */
export type AddressOwnerType = 'profile' | 'guest' | 'organization';

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy address data interface (camelCase, used by existing components)
 * This is for backward compatibility with FmAddressEditModal and AddressCell
 */
export interface LegacyAddressData {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country?: string | null;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a database Address to legacy format (for UI components)
 */
export function addressToLegacy(address: Address | null): LegacyAddressData {
  if (!address) {
    return {
      line1: null,
      line2: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
    };
  }
  return {
    line1: address.line_1,
    line2: address.line_2,
    city: address.city,
    state: address.state,
    zipCode: address.zip_code,
    country: address.country,
  };
}

/**
 * Convert legacy format to database Address format (for saving)
 */
export function legacyToAddressFormData(legacy: LegacyAddressData): AddressFormData {
  return {
    line_1: legacy.line1 || '',
    line_2: legacy.line2 || '',
    city: legacy.city || '',
    state: legacy.state || '',
    zip_code: legacy.zipCode || '',
    country: legacy.country || 'US',
  };
}

/**
 * Convert database Address to AddressFormData (for editing)
 */
export function addressToFormData(address: Address | null): AddressFormData {
  if (!address) {
    return {
      line_1: '',
      line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
    };
  }
  return {
    line_1: address.line_1 || '',
    line_2: address.line_2 || '',
    city: address.city || '',
    state: address.state || '',
    zip_code: address.zip_code || '',
    country: address.country || 'US',
  };
}

/**
 * Check if an address has any data
 */
export function hasAddressData(address: Address | LegacyAddressData | AddressFormData | null): boolean {
  if (!address) return false;

  // Handle all possible formats
  const line1 = 'line_1' in address ? address.line_1 : 'line1' in address ? address.line1 : null;
  const city = address.city;
  const state = address.state;
  const zipCode = 'zip_code' in address ? address.zip_code : 'zipCode' in address ? address.zipCode : null;

  return Boolean(line1 || city || state || zipCode);
}

/**
 * Format an address as a single-line string
 */
export function formatAddressOneLine(address: Address | LegacyAddressData | null): string {
  if (!address) return '';

  const parts: string[] = [];

  const line1 = 'line_1' in address ? address.line_1 : 'line1' in address ? address.line1 : null;
  const line2 = 'line_2' in address ? address.line_2 : 'line2' in address ? address.line2 : null;
  const city = address.city;
  const state = address.state;
  const zipCode = 'zip_code' in address ? address.zip_code : 'zipCode' in address ? address.zipCode : null;

  if (line1) parts.push(line1);
  if (line2) parts.push(line2);
  if (city) parts.push(city);
  if (state && zipCode) {
    parts.push(`${state} ${zipCode}`);
  } else if (state) {
    parts.push(state);
  } else if (zipCode) {
    parts.push(zipCode);
  }

  return parts.join(', ');
}

/**
 * Format an address as multi-line string (for display)
 */
export function formatAddressMultiLine(address: Address | LegacyAddressData | null): string[] {
  if (!address) return [];

  const lines: string[] = [];

  const line1 = 'line_1' in address ? address.line_1 : 'line1' in address ? address.line1 : null;
  const line2 = 'line_2' in address ? address.line_2 : 'line2' in address ? address.line2 : null;
  const city = address.city;
  const state = address.state;
  const zipCode = 'zip_code' in address ? address.zip_code : 'zipCode' in address ? address.zipCode : null;

  if (line1) lines.push(line1);
  if (line2) lines.push(line2);

  const cityStateZip: string[] = [];
  if (city) cityStateZip.push(city);
  if (state) cityStateZip.push(state);
  if (zipCode) cityStateZip.push(zipCode);

  if (cityStateZip.length > 0) {
    lines.push(cityStateZip.join(', '));
  }

  return lines;
}
