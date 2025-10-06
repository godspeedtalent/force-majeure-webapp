import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage (in-memory, resets on function restart)
const rateLimitMap = new Map<string, { attempts: number; resetAt: number }>();
const RATE_LIMIT_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.attempts >= RATE_LIMIT_ATTEMPTS) {
    return false;
  }

  record.attempts++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Too many validation attempts. Please try again in 1 minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Invalid code format',
          message: 'This code is not valid. Please scan a valid QR code.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get location using secret code
    const { data: locationData, error: locationError } = await supabase
      .rpc('get_location_preview', { p_secret_code: token });

    if (locationError) {
      console.error('Error fetching location:', locationError);
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Database error',
          message: 'Unable to validate code. Please try again.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!locationData || locationData.length === 0) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Invalid code',
          message: 'This QR code is not valid. Please check you scanned correctly.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = locationData[0];

    // Check if tokens are still available
    if (location.tokens_remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'No rewards remaining',
          message: `All rewards for ${location.location_name} have been claimed!`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Code is valid - return preview without promo code
    return new Response(
      JSON.stringify({
        valid: true,
        location_id: location.id,
        location_name: location.location_name,
        location_description: location.location_description,
        tokens_remaining: location.tokens_remaining,
        total_tokens: location.total_tokens
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in validate-scavenger-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
