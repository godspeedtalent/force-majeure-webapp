/**
 * Utility functions for formatting and handling addresses
 */

/**
 * Formats address components into a full address string
 * @param addressLine1 - Primary street address
 * @param addressLine2 - Secondary address (apt, suite, etc.)
 * @param city - City name
 * @param state - State code
 * @param zipCode - ZIP/postal code
 * @returns Formatted address string or null if no valid components
 */
export function formatFullAddress(
  addressLine1?: string | null,
  addressLine2?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null
): string | null {
  const parts: string[] = [];

  // Build street address
  if (addressLine1) {
    let streetAddress = addressLine1;
    if (addressLine2) {
      streetAddress += `, ${addressLine2}`;
    }
    parts.push(streetAddress);
  }

  // Add city
  if (city) {
    parts.push(city);
  }

  // Add state and zip together
  const stateZip = [state, zipCode].filter(Boolean).join(' ');
  if (stateZip) {
    parts.push(stateZip);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Generates a Google Maps embed URL for an address
 * Uses the free embed mode without API key requirement
 * Includes zoom level and enables scroll wheel zoom through gesture handling
 * @param address - Full formatted address string
 * @returns Google Maps embed URL or null if no address
 */
export function getGoogleMapsEmbedUrl(address: string | null): string | null {
  if (!address) return null;
  const encodedAddress = encodeURIComponent(address);
  // Use z=15 for good default zoom, ie=UTF8 for proper encoding
  return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;
}

/**
 * Generates a Google Maps search URL for an address (opens in new tab)
 * @param address - Full formatted address string
 * @returns Google Maps search URL or null if no address
 */
export function getGoogleMapsSearchUrl(address: string | null): string | null {
  if (!address) return null;
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}
