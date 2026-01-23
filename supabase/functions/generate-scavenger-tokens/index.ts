import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { verifyAuth, requireAnyRole } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface GenerateTokensRequest {
  location_id: string;
  tokens_config?: Array<{
    reward_type: 'free_ticket' | 'promo_code_20';
    count: number;
    promo_code?: string;
  }>;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify user is authenticated and has admin/developer role
    const { user, supabase: authSupabase } = await verifyAuth(req);
    console.log('[generate-scavenger-tokens] Auth verified for user:', user.id);

    await requireAnyRole(authSupabase, user.id, ['admin', 'developer']);
    console.log('[generate-scavenger-tokens] Role check passed for user:', user.id);

    // Use service role for operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { location_id, tokens_config = [] }: GenerateTokensRequest =
      await req.json();

    if (!location_id) {
      return new Response(
        JSON.stringify({ error: 'location_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify location exists
    const { data: location, error: locationError } = await supabase
      .from('scavenger_locations')
      .select('*')
      .eq('id', location_id)
      .single();

    if (locationError || !location) {
      return new Response(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate tokens based on config
    const tokens = [];
    const tokenRecords = [];

    for (const config of tokens_config) {
      for (let i = 0; i < config.count; i++) {
        // Generate cryptographically secure random token (32 characters)
        const tokenBytes = crypto.getRandomValues(new Uint8Array(16));
        const token = Array.from(tokenBytes, byte =>
          byte.toString(16).padStart(2, '0')
        ).join('');

        // Generate unique salt for this token
        const salt = await bcrypt.genSalt(10);

        // Hash the token
        const tokenHash = await bcrypt.hash(token, salt);

        tokens.push({
          unhashed: token,
          reward_type: config.reward_type,
          promo_code: config.promo_code,
          url: `${location.location_name.replace(/\s+/g, '-')}-${config.reward_type}-${i + 1}`,
        });

        tokenRecords.push({
          location_id,
          token_hash: tokenHash,
          token_salt: salt,
          reward_type: config.reward_type,
          promo_code: config.promo_code || null,
          is_claimed: false,
        });
      }
    }

    // Insert all tokens into database
    const { error: insertError } = await supabase
      .from('scavenger_tokens')
      .insert(tokenRecords);

    if (insertError) {
      console.error('Error inserting tokens:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate tokens',
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      `Generated ${tokens.length} tokens for location ${location.location_name}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        location_name: location.location_name,
        tokens_generated: tokens.length,
        tokens: tokens,
        message:
          'Use these unhashed tokens to create QR codes. They will NOT be stored in the database.',
        qr_code_format:
          'https://yourdomain.com/lf-system-scavenger-hunt?token={unhashed_token}',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[generate-scavenger-tokens] Error:', error);

    // Handle auth errors specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Unauthorized')) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (errorMessage.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
