import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  token: string;
  user_email: string;
  display_name: string;
  show_on_leaderboard: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      token: qrToken, 
      user_email, 
      display_name,
      show_on_leaderboard = false 
    }: ClaimRequest = await req.json();

    if (!qrToken) {
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

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid tokens found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching token
    let matchedToken = null;
    for (const tokenRecord of tokens) {
      try {
        const isMatch = await bcrypt.compare(qrToken, tokenRecord.token_hash);
        if (isMatch) {
          matchedToken = tokenRecord;
          break;
        }
      } catch (error) {
        console.error('Error comparing token:', error);
        continue;
      }
    }

    if (!matchedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = matchedToken.scavenger_locations;

    // Check if location has tokens remaining
    if (location.tokens_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'No tokens remaining at this location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already claimed at this location
    const { data: existingClaim } = await supabase
      .from('scavenger_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_id', location.id)
      .single();

    if (existingClaim) {
      return new Response(
        JSON.stringify({ error: 'You have already claimed a reward at this location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate claim position (how many have been claimed at this location)
    const claimPosition = (location.total_tokens - location.tokens_remaining) + 1;

    // Begin atomic transaction
    // 1. Mark token as claimed
    const { error: updateTokenError } = await supabase
      .from('scavenger_tokens')
      .update({
        is_claimed: true,
        claimed_by_user_id: user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', matchedToken.id);

    if (updateTokenError) {
      console.error('Error updating token:', updateTokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to claim token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Decrement tokens_remaining
    const { error: updateLocationError } = await supabase
      .from('scavenger_locations')
      .update({
        tokens_remaining: location.tokens_remaining - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id);

    if (updateLocationError) {
      console.error('Error updating location:', updateLocationError);
      // Rollback token claim
      await supabase
        .from('scavenger_tokens')
        .update({ is_claimed: false, claimed_by_user_id: null, claimed_at: null })
        .eq('id', matchedToken.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to update location' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create claim record
    const { error: createClaimError } = await supabase
      .from('scavenger_claims')
      .insert({
        user_id: user.id,
        location_id: location.id,
        token_id: matchedToken.id,
        claim_position: claimPosition,
        show_on_leaderboard,
        reward_type: matchedToken.reward_type,
        promo_code: matchedToken.promo_code,
        claimed_at: new Date().toISOString()
      });

    if (createClaimError) {
      console.error('Error creating claim:', createClaimError);
      // Rollback
      await supabase
        .from('scavenger_tokens')
        .update({ is_claimed: false, claimed_by_user_id: null, claimed_at: null })
        .eq('id', matchedToken.id);
      await supabase
        .from('scavenger_locations')
        .update({ tokens_remaining: location.tokens_remaining })
        .eq('id', location.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create claim record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Send email via Mailchimp Transactional
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_TRANSACTIONAL_API_KEY');
    
    if (mailchimpApiKey) {
      try {
        const rewardTypeDisplay = matchedToken.reward_type === 'free_ticket' 
          ? '🎫 Free Ticket' 
          : '🎟️ 20% Off';

        const emailPayload = {
          key: mailchimpApiKey,
          message: {
            from_email: "noreply@forcemajeure.com",
            from_name: "Force Majeure",
            subject: "🎉 You found it! Here's your LF System reward",
            text: `Congratulations ${display_name}!\n\nYou found location: ${location.location_name}\nYou were person #${claimPosition} to find this spot!\n\nYour reward: ${rewardTypeDisplay}\nPromo Code: ${matchedToken.promo_code}\n\nSee the leaderboard: ${supabaseUrl.replace('.supabase.co', '')}/scavenger-leaderboard`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #000; font-size: 28px; margin-bottom: 20px;">🎉 Congratulations ${display_name}!</h1>
                <p style="font-size: 16px; color: #333;">You found: <strong>${location.location_name}</strong></p>
                <p style="font-size: 16px; color: #333;">You were person <strong>#${claimPosition}</strong> to find this location!</p>
                <div style="background: #f0f0f0; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
                  <h2 style="color: #000; margin: 0 0 15px 0;">${rewardTypeDisplay}</h2>
                  <p style="font-size: 28px; font-weight: bold; color: hsl(348 100% 22%); margin: 0; letter-spacing: 2px;">${matchedToken.promo_code}</p>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  <a href="${supabaseUrl.replace('.supabase.co', '')}/scavenger-leaderboard" style="color: hsl(348 100% 22%); text-decoration: none; font-weight: bold;">View Leaderboard →</a>
                </p>
              </div>
            `,
            to: [{ email: user_email, name: display_name, type: "to" }]
          }
        };

        const emailResponse = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        } else {
          console.log('Email sent successfully to:', user_email);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the claim if email fails
      }
    } else {
      console.warn('MAILCHIMP_TRANSACTIONAL_API_KEY not set, skipping email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        claim_position: claimPosition,
        location_name: location.location_name,
        reward_type: matchedToken.reward_type,
        promo_code: matchedToken.promo_code,
        tokens_remaining: location.tokens_remaining - 1,
        message: `You're the ${claimPosition === 1 ? '1st' : claimPosition === 2 ? '2nd' : claimPosition === 3 ? '3rd' : `${claimPosition}th`} person to find this location! Check your email for your reward.`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in claim-scavenger-reward:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
