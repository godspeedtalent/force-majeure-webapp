import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
    const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SPOTIFY_CLIENT_SECRET || !SPOTIFY_CLIENT_ID) {
      console.error('Spotify credentials not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Spotify credentials not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, code, redirectUri, userId } = await req.json();

    if (action === 'client_credentials') {
      // Get access token using client credentials flow for app-only access
      const tokenResponse = await fetch(
        'https://accounts.spotify.com/api/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Spotify token request failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to get Spotify access token' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const tokenData = await tokenResponse.json();
      return new Response(JSON.stringify(tokenData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_auth_url') {
      const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
      ];

      const authUrl =
        `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}&` +
        `state=${userId}`;

      return new Response(JSON.stringify({ authUrl }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_code') {
      // Exchange authorization code for access and refresh tokens
      const tokenResponse = await fetch(
        'https://accounts.spotify.com/api/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Spotify token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange authorization code' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const tokenData = await tokenResponse.json();

      // Store tokens in user profile
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Store tokens securely using encryption
      const { error: secureStoreError } = await supabase.functions.invoke(
        'secure-tokens',
        {
          body: {
            action: 'store',
            userId: userId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
          },
        }
      );

      if (secureStoreError) {
        console.error('Error storing secure tokens:', secureStoreError);
        return new Response(
          JSON.stringify({ error: 'Failed to store tokens securely' }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Update profile with connection status and expiry (but not tokens)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          spotify_token_expires_at: expiresAt.toISOString(),
          spotify_connected: true,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update user profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save Spotify tokens' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ success: true, tokenData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh_token') {
      // Get user's encrypted refresh token
      const { data: tokens, error: tokensError } =
        await supabase.functions.invoke('secure-tokens', {
          body: {
            action: 'retrieve',
            userId: userId,
          },
        });

      if (tokensError || !tokens?.refreshToken) {
        return new Response(
          JSON.stringify({ error: 'No refresh token found' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Refresh the access token
      const tokenResponse = await fetch(
        'https://accounts.spotify.com/api/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refreshToken,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Spotify token refresh failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to refresh Spotify token' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const tokenData = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Store refreshed tokens securely
      const { error: secureStoreError } = await supabase.functions.invoke(
        'secure-tokens',
        {
          body: {
            action: 'store',
            userId: userId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || tokens.refreshToken,
          },
        }
      );

      if (secureStoreError) {
        console.error('Error storing refreshed tokens:', secureStoreError);
        return new Response(
          JSON.stringify({
            error: 'Failed to store refreshed tokens securely',
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Update profile with expiry only
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          spotify_token_expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update tokens:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save refreshed tokens' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in spotify-auth function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
