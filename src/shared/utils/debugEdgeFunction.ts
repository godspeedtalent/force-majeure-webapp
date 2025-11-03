/**
 * Debug utility to test Supabase edge function connectivity
 */

import { logger } from '@/shared/services/logger';

const debugLogger = logger.createNamespace('EdgeFunction');

export async function testEdgeFunctionConnectivity() {
  const baseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    'https://orgxcrnnecblhuxjfruy.supabase.co';

  debugLogger.debug('Testing Supabase Edge Function Connectivity');
  debugLogger.debug('Base URL', { baseUrl });

  // Test 1: Check if functions endpoint is accessible
  const functionsBaseUrl = `${baseUrl}/functions/v1/`;
  debugLogger.debug('Testing functions base URL', { functionsBaseUrl });

  try {
    const response = await fetch(functionsBaseUrl, { method: 'GET' });
    debugLogger.info('Functions endpoint accessible', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    debugLogger.error('Functions endpoint test failed', { error });
  }

  // Test 2: Check specific validate-location function
  const validateLocationUrl = `${baseUrl}/functions/v1/validate-location`;
  debugLogger.debug('Testing validate-location function', { validateLocationUrl });

  try {
    const response = await fetch(validateLocationUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    debugLogger.info('validate-location function response', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (response.ok || response.status === 400) {
      const text = await response.text();
      debugLogger.debug('Response body', { body: text });
    }
  } catch (error) {
    debugLogger.error('validate-location function test failed', { error });

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      debugLogger.error('This suggests one of the following issues', {
        issues: [
          'The edge function does not exist',
          'CORS policy is blocking the request',
          'Network connectivity issue',
          'Supabase project URL is incorrect'
        ]
      });
    }
  }

  // Test 3: Check environment variables
  debugLogger.debug('Environment check', {
    VITE_SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL || 'Not set (using fallback)',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? 'Set'
      : 'Not set',
  });
}

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).testEdgeFunctionConnectivity = testEdgeFunctionConnectivity;
}
