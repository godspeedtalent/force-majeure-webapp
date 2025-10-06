import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use a secret key for encryption (in production, this should be an environment variable)
const SECRET_KEY = Deno.env.get('PROXY_SECRET_KEY') || 'force-majeure-scavenger-2024';

async function encryptPayload(uuid: string, timestamp: number): Promise<string> {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      console.error('Missing token parameter');
      return new Response(
        'Missing token parameter',
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      console.error('Invalid UUID format:', token);
      return new Response(
        'Invalid token format',
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
      );
    }

    // Create encrypted payload with current timestamp
    const timestamp = Date.now();
    const encryptedCode = await encryptPayload(token, timestamp);

    console.log('Proxying token:', token.substring(0, 8) + '...', 'at', new Date(timestamp).toISOString());

    // Redirect to scavenger page with encrypted code
    const redirectUrl = `/scavenger?code=${encryptedCode}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });
  } catch (error: any) {
    console.error('Error in proxy-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
