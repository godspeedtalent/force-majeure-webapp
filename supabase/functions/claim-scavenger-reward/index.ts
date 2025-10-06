import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secret key for decryption (must match proxy-token function)
const SECRET_KEY = Deno.env.get('PROXY_SECRET_KEY') || 'force-majeure-scavenger-2024';
const CODE_EXPIRY_MS = 60000; // 1 minute

async function decryptPayload(encryptedCode: string): Promise<{ uuid: string; timestamp: number } | null> {
  try {
    // Restore base64 from URL-safe encoding
    const base64 = encryptedCode
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Pad base64 string if needed
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const key = encoder.encode(SECRET_KEY.padEnd(32, '0').slice(0, 32));
    
    // Decode base64
    const binaryString = atob(padded);
    const encrypted = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      encrypted[i] = binaryString.charCodeAt(i);
    }
    
    // XOR decrypt
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ key[i % key.length];
    }
    
    const payload = decoder.decode(decrypted);
    return JSON.parse(payload);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

interface ClaimRequest {
  token: string;  // This is the encrypted code
  user_email: string;
  display_name: string;
  show_on_leaderboard: boolean;
  device_fingerprint?: string;
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
      token: encryptedCode, 
      user_email, 
      display_name,
      show_on_leaderboard = false,
      device_fingerprint
    }: ClaimRequest = await req.json();

    if (!encryptedCode) {
      return new Response(
        JSON.stringify({ error: 'Code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the code to get UUID and timestamp
    const decrypted = await decryptPayload(encryptedCode);
    
    if (!decrypted) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { uuid: secretCode, timestamp } = decrypted;

    // Check if code has expired (older than 1 minute)
    const now = Date.now();
    const age = now - timestamp;
    
    if (age > CODE_EXPIRY_MS) {
      console.log('Code expired:', { age, limit: CODE_EXPIRY_MS });
      return new Response(
        JSON.stringify({ error: 'This QR code has expired. Please scan it again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create device fingerprint from IP and User-Agent if not provided
    const fingerprint = device_fingerprint || (() => {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      return `${ip}::${userAgent}`;
    })();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(secretCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get location details with promo code using security definer function
    const { data: locationData, error: locationError } = await supabase
      .rpc('get_location_with_promo', { p_secret_code: secretCode });

    if (locationError || !locationData || locationData.length === 0) {
      console.error('Error fetching location:', locationError);
      return new Response(
        JSON.stringify({ error: 'Location not found or inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = locationData[0];

    // Check if location has tokens remaining
    if (location.tokens_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'No rewards remaining at this location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already claimed at this location
    const { data: existingUserClaim } = await supabase
      .from('scavenger_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_id', location.id)
      .maybeSingle();

    if (existingUserClaim) {
      return new Response(
        JSON.stringify({ error: 'You have already claimed a reward at this location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if device already claimed at this location
    const { data: existingDeviceClaim } = await supabase
      .from('scavenger_claims')
      .select('*')
      .eq('device_fingerprint', fingerprint)
      .eq('location_id', location.id)
      .maybeSingle();

    if (existingDeviceClaim) {
      return new Response(
        JSON.stringify({ error: 'This device has already claimed a reward at this location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate claim position (how many have been claimed at this location)
    const claimPosition = (location.total_tokens - location.tokens_remaining) + 1;

    // Determine reward type based on claim position
    // 1st claim = free_ticket, claims 2-5 = promo_code_20
    const rewardType = claimPosition === 1 ? 'free_ticket' : 'promo_code_20';
    const promoCode = rewardType === 'promo_code_20' ? location.promo_code : null;

    // 1. Decrement tokens_remaining
    const { error: updateLocationError } = await supabase
      .from('scavenger_locations')
      .update({
        tokens_remaining: location.tokens_remaining - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id);

    if (updateLocationError) {
      console.error('Error updating location:', updateLocationError);
      return new Response(
        JSON.stringify({ error: 'Failed to update location' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create claim record
    const { error: createClaimError } = await supabase
      .from('scavenger_claims')
      .insert({
        user_id: user.id,
        location_id: location.id,
        claim_position: claimPosition,
        show_on_leaderboard,
        reward_type: rewardType,
        promo_code: promoCode,
        device_fingerprint: fingerprint,
        claimed_at: new Date().toISOString()
      });

    if (createClaimError) {
      console.error('Error creating claim:', createClaimError);
      // Rollback location update
      await supabase
        .from('scavenger_locations')
        .update({ tokens_remaining: location.tokens_remaining })
        .eq('id', location.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create claim record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Send email via Mailchimp Transactional
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_TRANSACTIONAL_API_KEY');
    
    if (mailchimpApiKey) {
      try {
        const rewardTypeDisplay = rewardType === 'free_ticket' 
          ? '🎫 Free Ticket' 
          : '🎟️ 20% Off';

        const emailPayload = {
          key: mailchimpApiKey,
          message: {
            from_email: "noreply@forcemajeure.com",
            from_name: "Force Majeure",
            subject: "🎉 You found it! Here's your LF System reward",
            text: `Congratulations ${display_name}!\n\nYou found location: ${location.location_name}\nYou were person #${claimPosition} to find this spot!\n\nYour reward: ${rewardTypeDisplay}${promoCode ? `\nPromo Code: ${promoCode}` : ''}\n\nSee the leaderboard: ${supabaseUrl.replace('.supabase.co', '')}/scavenger-leaderboard`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #000; font-size: 28px; margin-bottom: 20px;">🎉 Congratulations ${display_name}!</h1>
                <p style="font-size: 16px; color: #333;">You found: <strong>${location.location_name}</strong></p>
                <p style="font-size: 16px; color: #333;">You were person <strong>#${claimPosition}</strong> to find this location!</p>
                <div style="background: #f0f0f0; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
                  <h2 style="color: #000; margin: 0 0 15px 0;">${rewardTypeDisplay}</h2>
                  ${promoCode ? `<p style="font-size: 28px; font-weight: bold; color: hsl(348 100% 22%); margin: 0; letter-spacing: 2px;">${promoCode}</p>` : '<p style="font-size: 16px; color: #333;">You\'re on the guest list!</p>'}
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
        reward_type: rewardType,
        promo_code: promoCode,
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
