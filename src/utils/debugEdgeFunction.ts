/**
 * Debug utility to test Supabase edge function connectivity
 */

export async function testEdgeFunctionConnectivity() {
  const baseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    'https://orgxcrnnecblhuxjfruy.supabase.co';

  console.log('🔍 Testing Supabase Edge Function Connectivity...');
  console.log('Base URL:', baseUrl);

  // Test 1: Check if functions endpoint is accessible
  const functionsBaseUrl = `${baseUrl}/functions/v1/`;
  console.log('Testing functions base URL:', functionsBaseUrl);

  try {
    const response = await fetch(functionsBaseUrl, { method: 'GET' });
    console.log('✅ Functions endpoint accessible:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.error('❌ Functions endpoint test failed:', error);
  }

  // Test 2: Check specific validate-location function
  const validateLocationUrl = `${baseUrl}/functions/v1/validate-location`;
  console.log('Testing validate-location function:', validateLocationUrl);

  try {
    const response = await fetch(validateLocationUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ validate-location function response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (response.ok || response.status === 400) {
      const text = await response.text();
      console.log('Response body:', text);
    }
  } catch (error) {
    console.error('❌ validate-location function test failed:', error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('🚨 This suggests one of the following issues:');
      console.error('   1. The edge function does not exist');
      console.error('   2. CORS policy is blocking the request');
      console.error('   3. Network connectivity issue');
      console.error('   4. Supabase project URL is incorrect');
    }
  }

  // Test 3: Check environment variables
  console.log('Environment check:', {
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
