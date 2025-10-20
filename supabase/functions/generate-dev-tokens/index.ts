import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify service role authentication with exact match
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get all 5 scavenger hunt locations
    const { data: locations, error: locError } = await supabase
      .from('scavenger_locations')
      .select('id, location_name')
      .in('location_name', [
        'BOOGIE',
        'MIRRORBALL',
        'DISCO',
        'LADYBIRD',
        'KEEPITWEIRD',
      ])
      .order('location_name');

    if (locError || !locations || locations.length === 0) {
      return new Response(JSON.stringify({ error: 'No locations found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete ALL existing tokens first
    await supabase
      .from('scavenger_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    const tokenRecords = [];
    const generatedTokens = [];

    // Generate exactly 1 token per location
    // The plaintext token is just the location name itself
    for (const location of locations) {
      const plaintextToken = location.location_name; // e.g., "BOOGIE"
      const salt = await bcrypt.genSalt(10);
      const tokenHash = await bcrypt.hash(plaintextToken, salt);

      tokenRecords.push({
        location_id: location.id,
        token_hash: tokenHash,
        token_salt: salt,
        is_claimed: false,
      });

      generatedTokens.push({
        location: location.location_name,
        token: plaintextToken,
      });
    }

    // Also add the test tokens for dev panel
    const testTokens = [
      {
        plaintext: 'VALID_UNCLAIMED_TOKEN',
        location_name: 'BOOGIE',
        should_claim: false,
      },
      {
        plaintext: 'ALREADY_CLAIMED_TOKEN',
        location_name: 'MIRRORBALL',
        should_claim: true,
      },
      {
        plaintext: 'ANOTHER_VALID_TOKEN',
        location_name: 'DISCO',
        should_claim: false,
      },
    ];

    for (const testToken of testTokens) {
      const location = locations.find(
        l => l.location_name === testToken.location_name
      );
      if (!location) continue;

      const salt = await bcrypt.genSalt(10);
      const tokenHash = await bcrypt.hash(testToken.plaintext, salt);

      tokenRecords.push({
        location_id: location.id,
        token_hash: tokenHash,
        token_salt: salt,
        is_claimed: testToken.should_claim,
        claimed_by_user_id: testToken.should_claim
          ? '00000000-0000-0000-0000-000000000000'
          : null,
        claimed_at: testToken.should_claim ? new Date().toISOString() : null,
      });

      generatedTokens.push({
        location: testToken.location_name,
        token: testToken.plaintext,
        is_claimed: testToken.should_claim,
      });
    }

    // Insert new tokens
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
      `Generated ${tokenRecords.length} tokens across ${locations.length} locations`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${tokenRecords.length} tokens for ${locations.length} locations`,
        tokens: generatedTokens,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-dev-tokens:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
