import { supabase } from '@/shared/api/supabase/client';

export interface RouteConfig {
  label: string;
  showInBreadcrumb?: boolean;
  async?: boolean;
  resolver?: (params: Record<string, string>) => Promise<string> | string;
}

/**
 * Centralized route configuration with breadcrumb metadata
 * This allows for easy management of route labels and async data fetching
 */
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // Home
  '/': {
    label: 'Home',
    showInBreadcrumb: false, // Home is shown in logo, not breadcrumbs
  },

  // Events
  '/event/:id': {
    label: 'Event',
    async: true,
    resolver: async (params) => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('title, headliner:artists!events_headliner_id_fkey(name)')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        return data?.headliner?.name || data?.title || 'Event';
      } catch (error) {
        console.error('Failed to fetch event for breadcrumb:', error);
        return 'Event';
      }
    },
  },

  // Merch
  '/merch': {
    label: 'Merchandise',
  },

  // Profile
  '/profile': {
    label: 'Profile Settings',
  },

  // Orders
  '/orders': {
    label: 'My Orders',
  },

  // Checkout
  '/checkout/success': {
    label: 'Order Confirmed',
  },
  '/checkout/cancel': {
    label: 'Checkout Cancelled',
  },

  // Members
  '/members/home': {
    label: 'Member Portal',
  },

  // Scavenger Hunt
  '/scavenger': {
    label: 'Scavenger Hunt',
  },

  // Auth
  '/auth': {
    label: 'Sign In',
  },

  // Admin Routes
  '/admin': {
    label: 'Admin Dashboard',
  },
  '/admin/controls': {
    label: 'Database Controls',
  },
  '/admin/statistics': {
    label: 'Statistics',
  },

  // Demo Routes
  '/demo': {
    label: 'Demo',
  },
  '/demo/event-checkout': {
    label: 'Event Checkout Demo',
  },
  '/demo/event-checkout-confirmation': {
    label: 'Order Confirmed',
  },

  // 404
  '/404': {
    label: 'Page Not Found',
  },
};

/**
 * Match a path against route patterns, supporting dynamic segments
 * Example: matchRoute('/event/123', '/event/:id') => { id: '123' }
 */
export const matchRoute = (
  pathname: string,
  pattern: string
): Record<string, string> | null => {
  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // Dynamic segment
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      // Static segment doesn't match
      return null;
    }
  }

  return params;
};

/**
 * Find the route config for a given pathname
 */
export const findRouteConfig = (pathname: string): {
  config: RouteConfig;
  params: Record<string, string>;
} | null => {
  // Try exact match first
  if (ROUTE_CONFIG[pathname]) {
    return {
      config: ROUTE_CONFIG[pathname],
      params: {},
    };
  }

  // Try pattern matching
  for (const [pattern, config] of Object.entries(ROUTE_CONFIG)) {
    const params = matchRoute(pathname, pattern);
    if (params !== null) {
      return { config, params };
    }
  }

  return null;
};
