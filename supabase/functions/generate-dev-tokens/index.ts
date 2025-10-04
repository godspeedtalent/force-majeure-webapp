import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get first location
    const { data: locations, error: locError } = await supabase
      .from('scavenger_locations')
      .select('id, location_name')
      .limit(1)
      .single();

    if (locError || !locations) {
      return new Response(
        JSON.stringify({ error: 'No locations found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 3 test tokens with known values
    const testTokens = [
      { plaintext: 'VALID_UNCLAIMED_TOKEN', reward_type: 'free_ticket', should_claim: false },
      { plaintext: 'ALREADY_CLAIMED_TOKEN', reward_type: 'free_ticket', should_claim: true },
      { plaintext: 'ANOTHER_VALID_TOKEN', reward_type: 'promo_code_20', should_claim: false }
    ];

    const tokenRecords = [];
    
    for (const testToken of testTokens) {
      const salt = await bcrypt.genSalt(10);
      const tokenHash = await bcrypt.hash(testToken.plaintext, salt);

      tokenRecords.push({
        location_id: locations.id,
        token_hash: tokenHash,
        token_salt: salt,
        reward_type: testToken.reward_type,
        promo_code: testToken.reward_type === 'promo_code_20' ? 'TEST20' : null,
        is_claimed: testToken.should_claim,
        claimed_by_user_id: testToken.should_claim ? '00000000-0000-0000-0000-000000000000' : null,
        claimed_at: testToken.should_claim ? new Date().toISOString() : null
      });
    }

    // Delete existing test tokens first
    await supabase
      .from('scavenger_tokens')
      .delete()
      .eq('location_id', locations.id);

    // Insert new test tokens
    const { error: insertError } = await supabase
      .from('scavenger_tokens')
      .insert(tokenRecords);

    if (insertError) {
      console.error('Error inserting tokens:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate tokens', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generated ${testTokens.length} test tokens for ${locations.location_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        location_name: locations.location_name,
        tokens: testTokens.map(t => ({
          token: t.plaintext,
          reward_type: t.reward_type,
          is_claimed: t.should_claim
        }))
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in generate-dev-tokens:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
