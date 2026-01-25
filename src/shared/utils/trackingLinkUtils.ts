/**
 * Utility functions for tracking link URL generation.
 * Centralizes URL format to avoid hardcoding across the codebase.
 */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://orgxcrnnecblhuxjfruy.supabase.co';

/**
 * Gets the base URL for the application.
 * In production this would be the actual domain, in dev it's localhost.
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || 'http://localhost:8080';
}

/**
 * Generates the short tracking link URL that users can share.
 * This URL points to the app's /t/:code route which then redirects
 * to the edge function for tracking.
 *
 * @param code - The tracking link short code
 * @returns The shareable tracking URL (e.g., https://example.com/t/my-code)
 */
export function getTrackingLinkUrl(code: string): string {
  return `${getAppBaseUrl()}/t/${code}`;
}

/**
 * Gets the display format for a tracking link (just the path portion).
 * Used in UI where showing the full URL would be too long.
 *
 * @param code - The tracking link short code
 * @returns The short display format (e.g., /t/my-code)
 */
export function getTrackingLinkDisplayPath(code: string): string {
  return `/t/${code}`;
}

/**
 * Gets the direct Supabase edge function URL for tracking.
 * This is the actual endpoint that records clicks and redirects.
 * Used by the TrackingLinkRedirect page.
 *
 * @param code - The tracking link short code
 * @returns The edge function URL
 */
export function getTrackingLinkEdgeFunctionUrl(code: string): string {
  // Pass the origin so the edge function knows where to redirect back to
  // This is essential for local development where we want to stay on localhost
  const origin = encodeURIComponent(getAppBaseUrl());
  return `${SUPABASE_URL}/functions/v1/track-link?code=${code}&origin=${origin}`;
}
