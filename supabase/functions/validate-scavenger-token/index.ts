import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all unclaimed tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('scavenger_tokens')
      .select('*, scavenger_locations(*)')
      .eq('is_claimed', false);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'No tokens available',
          message: 'All rewards have been claimed!'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check each token hash
    let matchedToken = null;
    for (const tokenRecord of tokens) {
      try {
        const isMatch = await bcrypt.compare(token, tokenRecord.token_hash);
        if (isMatch) {
          matchedToken = tokenRecord;
          break;
        }
      } catch (error) {
        console.error('Error comparing token hash:', error);
        continue;
      }
    }

    if (!matchedToken) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Invalid token',
          message: 'This QR code is not valid. Please check you scanned correctly.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = matchedToken.scavenger_locations;

    // Check if location is still active
    if (!location.is_active) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Location inactive',
          message: 'This location is no longer active.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if tokens are still available
    if (location.tokens_remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'No tokens remaining',
          message: `All rewards for ${location.location_name} have been claimed!`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Token is valid
    return new Response(
      JSON.stringify({
        valid: true,
        token_id: matchedToken.id,
        location_id: location.id,
        location_name: location.location_name,
        location_description: location.location_description,
        reward_type: location.reward_type,
        tokens_remaining: location.tokens_remaining,
        total_tokens: location.total_tokens,
        promo_code: location.promo_code
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
