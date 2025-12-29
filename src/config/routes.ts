import { supabase } from '@/shared';
import { logger } from '@/shared';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (v: string | undefined): v is string =>
  Boolean(v && UUID_REGEX.test(v));

export interface RouteConfig {
  label: string;
  showInBreadcrumb?: boolean;
  skipParentInBreadcrumb?: boolean; // When true, skips parent segments (e.g., /artists/signup shows only "Register to perform", not "Artists > Register to perform")
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
    label: '',
    async: true,
    resolver: async params => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('title, headliner:artists!events_headliner_id_fkey(name)')
          .eq('id', params.id)
          .maybeSingle();

        if (error || !data) {
          logger.error('Failed to fetch event for breadcrumb:', { context: error });
          return '';
        }
        return (data as any)?.headliner?.name || (data as any)?.title || '';
      } catch (error) {
        logger.error('Failed to fetch event for breadcrumb:', { context: error });
        return '';
      }
    },
  },
  '/event/:id/tickets': {
    label: 'Tickets',
  },

  // Merch
  '/merch': {
    label: 'Merchandise',
  },

  // Profile
  '/profile': {
    label: 'Profile',
    async: true,
    resolver: async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return 'Profile';

        // Fetch user profile for display_name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        return (
          profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          'Profile'
        );
      } catch (error) {
        logger.error('Failed to fetch user for breadcrumb:', { context: error });
        return 'Profile';
      }
    },
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

  // Venues
  '/venues': {
    label: 'Venues',
  },
  '/venues/:id': {
    label: '',
    async: true,
    resolver: async params => {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('name')
          .eq('id', params.id)
          .maybeSingle();

        if (error || !data) {
          logger.error('Failed to fetch venue for breadcrumb:', { context: error });
          return 'Venue';
        }
        return data.name || 'Venue';
      } catch (error) {
        logger.error('Failed to fetch venue for breadcrumb:', { context: error });
        return 'Venue';
      }
    },
  },
  '/venues/:id/manage': {
    label: 'Manage',
  },

  // Artists
  '/artists': {
    label: 'Artists',
  },
  '/artists/register': {
    label: 'Register to perform',
    skipParentInBreadcrumb: true,
  },
  '/artists/signup': {
    label: 'Register to perform',
    skipParentInBreadcrumb: true,
  },
  '/artists/:id': {
    label: '',
    async: true,
    resolver: async params => {
      // Skip DB query for non-UUID ids (e.g., "register", "signup")
      if (!isUuid(params.id)) return 'Artist';

      try {
        const { data, error } = await supabase
          .from('artists')
          .select('name')
          .eq('id', params.id)
          .maybeSingle();

        if (error || !data) {
          return 'Artist';
        }
        return data.name || 'Artist';
      } catch {
        return 'Artist';
      }
    },
  },
  '/artists/:id/manage': {
    label: 'Manage',
  },

  // Admin Routes
  '/admin/controls': {
    label: 'Admin Controls',
  },
  '/admin/statistics': {
    label: 'Statistics',
  },
  '/admin/logs': {
    label: 'Activity Logs',
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
  '/demo/email-template': {
    label: 'Email Template Demo',
  },

  // Developer pages
  '/developer': {
    label: 'Developer Tools',
  },
  '/developer/database': {
    label: 'Database Navigator',
  },
  '/developer/components': {
    label: 'FM Components Catalog',
  },
  '/developer/documentation': {
    label: 'Documentation Viewer',
  },
  '/developer/ticket-flow': {
    label: 'Ticket Flow Tests',
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
export const findRouteConfig = (
  pathname: string
): {
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
