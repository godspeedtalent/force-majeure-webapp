import type { NavigateFunction, Location } from 'react-router-dom';

/**
 * Standard interface for navigation state when redirecting to auth
 */
export interface AuthNavigationState {
  /** The URL path to return to after authentication */
  returnTo: string;
}

/**
 * Get the full URL path including search params from a Location object.
 */
function getFullPath(location: Location): string {
  return location.pathname + location.search;
}

/**
 * Navigate to auth page with standardized return URL handling.
 *
 * This utility ensures consistent behavior across all auth redirects:
 * - Preserves the user's intended destination INCLUDING query parameters
 * - Uses a standard state format that Auth.tsx can read
 *
 * @example
 * // From a component - preserves full URL including query params
 * navigateToAuth(navigate, { location });
 *
 * // With explicit return path
 * navigateToAuth(navigate, { returnTo: '/artists/register?event_id=abc' });
 */
export function navigateToAuth(
  navigate: NavigateFunction,
  options: {
    /** Explicit return URL (highest priority) */
    returnTo?: string;
    /** React Router location object - will use pathname + search */
    location?: Location;
    /** Whether to replace the current history entry */
    replace?: boolean;
  } = {}
): void {
  const { returnTo, location, replace = false } = options;

  // Priority: explicit returnTo > location (pathname + search) > current URL
  // Include search params to preserve query strings like ?event_id=xxx
  const returnPath =
    returnTo ??
    (location ? getFullPath(location) : null) ??
    window.location.pathname + window.location.search;

  const state: AuthNavigationState = {
    returnTo: returnPath,
  };

  navigate('/auth', { state, replace });
}

/**
 * Get the return URL from navigation state.
 *
 * Supports both the new standardized format ({ returnTo: string })
 * and the legacy React Router format ({ from: { pathname: string } })
 * for backward compatibility with ProtectedRoute.
 *
 * @param locationState - The location.state from React Router
 * @returns The return URL, or '/' if none found
 */
export function getReturnUrl(locationState: unknown): string {
  if (!locationState || typeof locationState !== 'object') {
    return '/';
  }

  const state = locationState as Record<string, unknown>;

  // New standard: returnTo string (preferred)
  if (typeof state.returnTo === 'string') {
    return state.returnTo;
  }

  // Legacy: from.pathname (React Router pattern from ProtectedRoute)
  if (state.from && typeof state.from === 'object') {
    const from = state.from as Record<string, unknown>;
    if (typeof from.pathname === 'string') {
      return from.pathname;
    }
  }

  return '/';
}
