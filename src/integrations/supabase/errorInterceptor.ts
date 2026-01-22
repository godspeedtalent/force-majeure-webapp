/**
 * Supabase Error Interceptor
 *
 * Automatically catches and displays error toasts for Supabase errors
 * when users have admin, developer, or FM staff roles.
 *
 * This runs in the background and doesn't require explicit error handling
 * in components, though using handleError() is still recommended for
 * better control and context.
 */

import { logger } from '@/shared';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { supabase } from './client';

interface ErrorInterceptorConfig {
  /** Whether to enable automatic error toasts (default: true) */
  enabled: boolean;
  /** Minimum role required to see error toasts (default: 'fm_staff') */
  minRole: 'admin' | 'developer' | 'fm_staff';
}

// Global config
let config: ErrorInterceptorConfig = {
  enabled: true,
  minRole: 'fm_staff',
};

// Track user role for error display
let currentUserRole: string | null = null;

/**
 * Set the current user's role for error toast display
 * This should be called by the auth system when user logs in
 */
export function setUserRoleForErrorInterceptor(role: string | null) {
  currentUserRole = role;
}

/**
 * Configure the error interceptor
 */
export function configureErrorInterceptor(options: Partial<ErrorInterceptorConfig>) {
  config = { ...config, ...options };
}

/**
 * Check if the current user should see error toasts
 */
function shouldShowErrorToast(): boolean {
  if (!config.enabled || !currentUserRole) return false;

  const roleHierarchy = ['admin', 'developer', 'fm_staff'];
  const minRoleIndex = roleHierarchy.indexOf(config.minRole);
  const userRoleIndex = roleHierarchy.indexOf(currentUserRole);

  return userRoleIndex !== -1 && userRoleIndex <= minRoleIndex;
}

/**
 * Extract method and endpoint from Supabase error context
 */
function extractSupabaseContext(error: unknown): {
  method?: string;
  endpoint?: string;
  details?: string;
} {
  if (!error || typeof error !== 'object') return {};

  const err = error as Record<string, unknown>;

  // Try to extract from error object
  let endpoint = 'unknown';
  let method = 'UNKNOWN';

  // Supabase PostgrestError format
  if ('message' in err && typeof err.message === 'string') {
    const msg = err.message;

    // Try to extract table name from message
    const tableMatch = msg.match(/relation "(\w+)"/i) || msg.match(/table "(\w+)"/i);
    if (tableMatch) {
      endpoint = tableMatch[1];
    }

    // Determine method from message
    if (msg.includes('select') || msg.includes('SELECT')) method = 'SELECT';
    else if (msg.includes('insert') || msg.includes('INSERT')) method = 'INSERT';
    else if (msg.includes('update') || msg.includes('UPDATE')) method = 'UPDATE';
    else if (msg.includes('delete') || msg.includes('DELETE')) method = 'DELETE';
  }

  // Extract details if available
  let details: string | undefined;
  if ('details' in err && err.details) {
    details = typeof err.details === 'string' ? err.details : JSON.stringify(err.details);
  }

  return { method, endpoint, details };
}

/**
 * Handle Supabase query errors
 */
function handleSupabaseError(error: unknown, context?: string) {
  // Always log the error
  logger.error('Supabase Error Intercepted', {
    error: error instanceof Error ? error.message : String(error),
    context,
    userRole: currentUserRole,
  });

  // Only show toast if user has appropriate role
  if (!shouldShowErrorToast()) {
    return;
  }

  // Extract context from error
  const { method, endpoint, details } = extractSupabaseContext(error);

  // Determine error title based on HTTP status
  let title = 'Database Error';
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if ('code' in err) {
      const code = String(err.code);
      if (code === '403' || code === '42501') {
        title = 'Permission Denied';
      } else if (code === '401') {
        title = 'Authentication Required';
      } else if (code === '404' || code === '42P01') {
        title = 'Resource Not Found';
      } else if (code === '400') {
        title = 'Bad Request';
      }
    }
  }

  // Show error toast
  const errorObj = error instanceof Error ? error : new Error(
    error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : String(error)
  );

  showErrorToast({
    title,
    description: details || errorObj.message,
    error: errorObj,
    userRole: currentUserRole || undefined,
    context: context || 'Supabase Query',
    endpoint,
    method,
  });
}

/**
 * Initialize the Supabase error interceptor
 *
 * NOTE: This is a passive listener approach since Supabase doesn't have
 * built-in interceptors. For full coverage, use handleError() in catch blocks.
 */
export function initializeSupabaseErrorInterceptor() {
  // Listen for auth state changes to update user role
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      // Fetch user roles to determine if they should see error toasts
      try {
        const { data } = await supabase.rpc('get_user_roles', {
          user_id_param: session.user.id,
        });

        if (data && Array.isArray(data) && data.length > 0) {
          // Check for admin/developer/fm_staff roles
          const roles = data.map((r: { role_name: string }) => r.role_name);

          if (roles.includes('admin')) {
            setUserRoleForErrorInterceptor('admin');
          } else if (roles.includes('developer')) {
            setUserRoleForErrorInterceptor('developer');
          } else if (roles.includes('fm_staff')) {
            setUserRoleForErrorInterceptor('fm_staff');
          } else {
            setUserRoleForErrorInterceptor(null);
          }
        } else {
          setUserRoleForErrorInterceptor(null);
        }
      } catch (err) {
        logger.error('Failed to fetch user roles for error interceptor', { error: err });
        setUserRoleForErrorInterceptor(null);
      }
    } else {
      setUserRoleForErrorInterceptor(null);
    }
  });

  // Log that interceptor is ready
  logger.info('Supabase error interceptor initialized (passive mode)');
  logger.info('For full error coverage, use handleError() in catch blocks');
}

// Global error handler for uncaught promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    // Check if this looks like a Supabase error
    if (
      error &&
      typeof error === 'object' &&
      ('code' in error || 'details' in error || 'hint' in error)
    ) {
      logger.warn('Unhandled Supabase promise rejection detected', { error });
      handleSupabaseError(error, 'Unhandled Promise Rejection');

      // Prevent default browser error handling for Supabase errors
      event.preventDefault();
    }
  });
}

export { handleSupabaseError };
