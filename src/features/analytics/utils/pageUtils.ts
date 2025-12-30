/**
 * Page Utilities
 *
 * Utilities for extracting page information from URLs.
 */

import type { PageSource } from '../types';

/**
 * Page type mappings for common routes
 */
const PAGE_TYPE_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /^\/events\/[^/]+$/, type: 'event' },
  { pattern: /^\/events\/[^/]+\/tickets$/, type: 'ticketing' },
  { pattern: /^\/events\/?$/, type: 'event_list' },
  { pattern: /^\/venues\/[^/]+$/, type: 'venue' },
  { pattern: /^\/venues\/?$/, type: 'venue_list' },
  { pattern: /^\/artists\/[^/]+$/, type: 'artist' },
  { pattern: /^\/artists\/?$/, type: 'artist_list' },
  { pattern: /^\/checkout/, type: 'checkout' },
  { pattern: /^\/checkout-success/, type: 'checkout_success' },
  { pattern: /^\/checkout-cancel/, type: 'checkout_cancel' },
  { pattern: /^\/orders/, type: 'orders' },
  { pattern: /^\/profile/, type: 'profile' },
  { pattern: /^\/auth/, type: 'auth' },
  { pattern: /^\/admin/, type: 'admin' },
  { pattern: /^\/developer/, type: 'developer' },
  { pattern: /^\/demo/, type: 'demo' },
  { pattern: /^\/merch/, type: 'merch' },
  { pattern: /^\/contact/, type: 'contact' },
  { pattern: /^\/$/, type: 'home' },
];

/**
 * Get page type from URL path
 */
export function getPageType(path: string): string {
  for (const { pattern, type } of PAGE_TYPE_PATTERNS) {
    if (pattern.test(path)) {
      return type;
    }
  }
  return 'other';
}

/**
 * Extract resource ID from URL path (e.g., event ID, venue ID)
 */
export function getResourceId(path: string): string | undefined {
  // Match patterns like /events/{uuid}, /venues/{uuid}, /artists/{uuid}
  const match = path.match(/^\/(events|venues|artists|recordings)\/([a-f0-9-]{36})/i);
  return match ? match[2] : undefined;
}

/**
 * Determine page source from referrer
 */
export function getPageSource(referrer: string | null, currentOrigin: string): PageSource {
  if (!referrer) {
    return 'direct';
  }

  try {
    const referrerUrl = new URL(referrer);

    // Internal navigation
    if (referrerUrl.origin === currentOrigin) {
      return 'internal';
    }

    const hostname = referrerUrl.hostname.toLowerCase();

    // Search engines
    if (
      hostname.includes('google.') ||
      hostname.includes('bing.') ||
      hostname.includes('yahoo.') ||
      hostname.includes('duckduckgo.') ||
      hostname.includes('baidu.')
    ) {
      return 'search_engine';
    }

    // Social media
    if (
      hostname.includes('facebook.') ||
      hostname.includes('instagram.') ||
      hostname.includes('twitter.') ||
      hostname.includes('x.com') ||
      hostname.includes('linkedin.') ||
      hostname.includes('tiktok.') ||
      hostname.includes('reddit.')
    ) {
      return 'social';
    }

    // Email services
    if (
      hostname.includes('mail.') ||
      hostname.includes('gmail.') ||
      hostname.includes('outlook.') ||
      hostname.includes('yahoo.') ||
      hostname.includes('mailchimp.')
    ) {
      return 'email';
    }

    // External referrer
    return 'external';
  } catch {
    return 'external';
  }
}

/**
 * Get referrer URL
 */
export function getReferrer(): string | null {
  try {
    return document.referrer || null;
  } catch {
    return null;
  }
}

/**
 * Get current origin
 */
export function getCurrentOrigin(): string {
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}
