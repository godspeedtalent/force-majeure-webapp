import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAuth, isAdmin } from '../_shared/auth.ts';

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
    // SECURITY: Verify user is authenticated
    const { user, supabase: authSupabase } = await verifyAuth(req);
    console.log('[secure-tokens] Auth verified for user:', user.id);

    // Use service role for encryption/decryption operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody: RequestBody = await req.json();
    const { action, userId, accessToken, refreshToken } = requestBody;

    // Default to authenticated user's ID if not provided
    const targetUserId = userId || user.id;

    // SECURITY: Users can only access their own tokens unless they're admin
    if (targetUserId !== user.id) {
      const userIsAdmin = await isAdmin(authSupabase, user.id);
      if (!userIsAdmin) {
        console.warn('[secure-tokens] Forbidden: User', user.id, 'tried to access tokens for', targetUserId);
        return new Response(JSON.stringify({ error: 'Forbidden: Cannot access other user tokens' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[secure-tokens] Admin bypass: User', user.id, 'accessing tokens for', targetUserId);
    }

    // Create a user-specific salt for encryption
    const userSalt = targetUserId.substring(0, 16).padEnd(16, '0');

    if (action === 'store') {
      console.log(`[secure-tokens] Storing encrypted tokens for user: ${targetUserId}`);

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
          .eq('user_id', targetUserId);

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
      console.log(`[secure-tokens] Retrieving encrypted tokens for user: ${targetUserId}`);

      // Get encrypted tokens from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'spotify_access_token_encrypted, spotify_refresh_token_encrypted'
        )
        .eq('user_id', targetUserId)
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
    console.error('[secure-tokens] Error:', error);

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

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
