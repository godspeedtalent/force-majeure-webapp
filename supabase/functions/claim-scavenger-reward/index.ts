import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Secret key for decryption (must match proxy-token function)
const SECRET_KEY =
  Deno.env.get('PROXY_SECRET_KEY') || 'force-majeure-scavenger-2024';
const CODE_EXPIRY_MS = 60000; // 1 minute

async function decryptPayload(
  encryptedCode: string
): Promise<{ uuid: string; timestamp: number } | null> {
  try {
    // Restore base64 from URL-safe encoding
    const base64 = encryptedCode.replace(/-/g, '+').replace(/_/g, '/');

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
  token: string; // This is the encrypted code
  user_email: string;
  display_name: string;
  show_on_leaderboard: boolean;
  device_fingerprint?: string;
}

serve(async req => {
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
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      token: encryptedCode,
      user_email,
      display_name,
      show_on_leaderboard = false,
      device_fingerprint,
    }: ClaimRequest = await req.json();

    if (!encryptedCode) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt the code to get UUID and timestamp
    const decrypted = await decryptPayload(encryptedCode);

    if (!decrypted) {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { uuid: secretCode, timestamp } = decrypted;

    // Check if code has expired (older than 1 minute)
    const now = Date.now();
    const age = now - timestamp;

    if (age > CODE_EXPIRY_MS) {
      console.log('Code expired:', { age, limit: CODE_EXPIRY_MS });
      return new Response(
        JSON.stringify({
          error: 'This QR code has expired. Please scan it again.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create device fingerprint from IP and User-Agent if not provided
    const fingerprint =
      device_fingerprint ||
      (() => {
        const ip =
          req.headers.get('x-forwarded-for') ||
          req.headers.get('x-real-ip') ||
          'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        return `${ip}::${userAgent}`;
      })();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(secretCode)) {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get location details with promo code using location ID
    const { data: locationData, error: locationError } = await supabase.rpc(
      'get_location_with_promo',
      { p_location_id: secretCode }
    );

    if (locationError || !locationData || locationData.length === 0) {
      console.error('Error fetching location:', locationError);
      return new Response(
        JSON.stringify({ error: 'Location not found or inactive' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const location = locationData[0];

    // Check if this checkpoint has already been discovered by ANYONE
    const { data: existingClaim } = await supabase
      .from('scavenger_claims')
      .select('*')
      .eq('location_id', location.id)
      .maybeSingle();

    if (existingClaim) {
      return new Response(
        JSON.stringify({
          error:
            'This checkpoint has already been discovered by another explorer!',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already claimed at this location (redundant but keeping for safety)
    const { data: existingUserClaim } = await supabase
      .from('scavenger_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_id', location.id)
      .maybeSingle();

    if (existingUserClaim) {
      return new Response(
        JSON.stringify({
          error: 'You have already claimed a reward at this location',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
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
        JSON.stringify({
          error: 'This device has already claimed a reward at this location',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Each checkpoint is claimed once and adds 2 people to guestlist
    const claimPosition = 1;
    const rewardType = 'guestlist_2';
    const promoCode = null; // No promo code needed - they're on the list!

    // Create claim record (location is now discovered)
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
        claimed_at: new Date().toISOString(),
      });

    if (createClaimError) {
      console.error('Error creating claim:', createClaimError);
      return new Response(
        JSON.stringify({ error: 'Failed to create claim record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Send email via Mailchimp Transactional
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_TRANSACTIONAL_API_KEY');

    if (mailchimpApiKey) {
      try {
        const emailPayload = {
          key: mailchimpApiKey,
          message: {
            from_email: 'noreply@forcemajeure.com',
            from_name: 'Force Majeure',
            subject: '🎉 Checkpoint Discovered! You + 1 are on the list',
            text: `Congratulations ${display_name}!\n\nYou discovered checkpoint: ${location.location_name}\n\nYour reward: You and a friend are on the guestlist for LF SYSTEM!\n\nSee the leaderboard: ${supabaseUrl.replace('.supabase.co', '')}/scavenger`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #000; font-size: 28px; margin-bottom: 20px;">🎉 Checkpoint Discovered!</h1>
                <p style="font-size: 16px; color: #333;">You found: <strong>${location.location_name}</strong></p>
                <div style="background: #f0f0f0; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
                  <h2 style="color: #000; margin: 0 0 15px 0;">🎫 You + 1 on the Guestlist</h2>
                  <p style="font-size: 16px; color: #333; margin: 0;">You and a friend are on the list for LF SYSTEM!</p>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  <a href="${supabaseUrl.replace('.supabase.co', '')}/scavenger" style="color: hsl(348 100% 22%); text-decoration: none; font-weight: bold;">View Your Progress →</a>
                </p>
              </div>
            `,
            to: [{ email: user_email, name: display_name, type: 'to' }],
          },
        };

        const emailResponse = await fetch(
          'https://mandrillapp.com/api/1.0/messages/send',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          }
        );

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
        message: `Checkpoint discovered! You and a friend are on the guestlist. Check your email for confirmation.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in claim-scavenger-reward:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
