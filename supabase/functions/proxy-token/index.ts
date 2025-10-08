import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Use a secret key for encryption (in production, this should be an environment variable)
const SECRET_KEY =
  Deno.env.get('PROXY_SECRET_KEY') || 'force-majeure-scavenger-2024';

async function encryptPayload(
  uuid: string,
  timestamp: number
): Promise<string> {
  const payload = JSON.stringify({ uuid, timestamp });
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(SECRET_KEY.padEnd(32, '0').slice(0, 32));

  // Simple XOR encryption with base64 encoding
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }

  // Convert to base64 URL-safe encoding
  return btoa(String.fromCharCode(...encrypted))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

serve(async req => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const debugMode = url.searchParams.get('debug') === 'true';

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Request received:', {
        timestamp: new Date().toISOString(),
        url: req.url,
        token: token ? `${token.substring(0, 8)}...` : null,
        method: req.method,
      });
    }

    if (!token) {
      console.error('Missing token parameter');
      if (debugMode) {
        console.log(
          '[PROXY-TOKEN DEBUG] Validation failed: Missing token parameter'
        );
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: '/scavenger?error=invalid_token&token=',
        },
      });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      console.error('Invalid UUID format:', token);
      if (debugMode) {
        console.log(
          '[PROXY-TOKEN DEBUG] Validation failed: Invalid UUID format',
          {
            token,
            regex: uuidRegex.toString(),
          }
        );
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(token)}`,
        },
      });
    }

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] UUID validation passed:', {
        token: `${token.substring(0, 8)}...`,
        isValid: true,
      });
    }

    // Create encrypted payload with current timestamp
    const timestamp = Date.now();
    const encryptedCode = await encryptPayload(token, timestamp);

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Encryption complete:', {
        timestamp: new Date(timestamp).toISOString(),
        encryptedLength: encryptedCode.length,
        encrypted: `${encryptedCode.substring(0, 20)}...`,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    console.log(
      'Proxying token:',
      token.substring(0, 8) + '...',
      'at',
      new Date(timestamp).toISOString()
    );

    // Redirect to scavenger page with encrypted code
    const redirectUrl = `/scavenger?code=${encryptedCode}${debugMode ? '&debug=true' : ''}`;

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Redirecting to:', redirectUrl);
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirectUrl,
      },
    });
  } catch (error: any) {
    console.error('Error in proxy-token:', error);
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const debugMode = url.searchParams.get('debug') === 'true';

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Error occurred:', {
        error: error.message,
        stack: error.stack,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `/scavenger?error=proxy_error&token=${encodeURIComponent(token || '')}${debugMode ? '&debug=true' : ''}`,
      },
    });
  }
});
