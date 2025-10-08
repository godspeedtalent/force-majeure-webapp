import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'store' | 'retrieve';
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
}

Deno.serve(async req => {
  console.log(`${req.method} request received`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody: RequestBody = await req.json();
    const { action, userId, accessToken, refreshToken } = requestBody;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a user-specific salt for encryption
    const userSalt = userId.substring(0, 16).padEnd(16, '0');

    if (action === 'store') {
      console.log(`Storing encrypted tokens for user: ${userId}`);

      const updates: any = {};

      if (accessToken) {
        // Encrypt access token
        const { data: encryptedAccess } = await supabase.rpc('encrypt_token', {
          token_value: accessToken,
          user_salt: userSalt,
        });
        if (encryptedAccess) {
          updates.spotify_access_token_encrypted = encryptedAccess;
        }
      }

      if (refreshToken) {
        // Encrypt refresh token
        const { data: encryptedRefresh } = await supabase.rpc('encrypt_token', {
          token_value: refreshToken,
          user_salt: userSalt,
        });
        if (encryptedRefresh) {
          updates.spotify_refresh_token_encrypted = encryptedRefresh;
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error storing encrypted tokens:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to store tokens' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'retrieve') {
      console.log(`Retrieving encrypted tokens for user: ${userId}`);

      // Get encrypted tokens from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'spotify_access_token_encrypted, spotify_refresh_token_encrypted'
        )
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error retrieving profile:', profileError);
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result: any = {};

      // Decrypt access token if it exists
      if (profile.spotify_access_token_encrypted) {
        const { data: decryptedAccess } = await supabase.rpc('decrypt_token', {
          encrypted_token: profile.spotify_access_token_encrypted,
          user_salt: userSalt,
        });
        result.accessToken = decryptedAccess;
      }

      // Decrypt refresh token if it exists
      if (profile.spotify_refresh_token_encrypted) {
        const { data: decryptedRefresh } = await supabase.rpc('decrypt_token', {
          encrypted_token: profile.spotify_refresh_token_encrypted,
          user_salt: userSalt,
        });
        result.refreshToken = decryptedRefresh;
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in secure-tokens function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
