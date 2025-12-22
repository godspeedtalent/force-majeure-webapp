/**
 * Shared CORS configuration for Edge Functions
 *
 * Security: Restricts API access to allowed origins only.
 * Configure ALLOWED_ORIGINS environment variable with comma-separated domains.
 *
 * Example: ALLOWED_ORIGINS=https://forcemajeure.com,https://app.forcemajeure.com
 */

// Get allowed origins from environment, with localhost fallback for development
const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  // Default to localhost for development
  return [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
  ];
};

/**
 * Get CORS headers for a request
 * Returns appropriate Access-Control-Allow-Origin based on the request origin
 */
export const getCorsHeaders = (requestOrigin?: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();

  // Check if request origin is in allowed list
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]; // Fallback to first allowed origin

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
};

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin?: string | null): boolean => {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

/**
 * Create a 403 Forbidden response for unauthorized origins
 */
export const createForbiddenResponse = (): Response => {
  return new Response(
    JSON.stringify({ error: 'Origin not allowed' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

/**
 * Handle OPTIONS preflight request
 */
export const handleCorsPreflightRequest = (requestOrigin?: string | null): Response => {
  return new Response(null, {
    headers: getCorsHeaders(requestOrigin)
  });
};

/**
 * Wildcard CORS headers for webhook endpoints that need to accept requests from any origin
 * (e.g., Stripe webhooks)
 */
export const wildcardCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
