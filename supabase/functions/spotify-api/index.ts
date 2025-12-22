import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest, isOriginAllowed, createForbiddenResponse } from '../_shared/cors.ts';

// Token management
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Spotify access token:', error);
    throw new Error(`Spotify authentication failed: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry to 5 minutes before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken || '';
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  // Check origin for non-preflight requests
  if (!isOriginAllowed(origin)) {
    return createForbiddenResponse();
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const token = await getAccessToken();

    let spotifyResponse: Response;
    let result: unknown;

    switch (action) {
      case 'search': {
        const query = url.searchParams.get('q');
        const limitParam = url.searchParams.get('limit') || '10';

        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query parameter "q" is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate query length (max 200 characters to prevent abuse)
        if (query.length > 200) {
          return new Response(
            JSON.stringify({ error: 'Query too long. Maximum 200 characters allowed.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate limit parameter (Spotify API accepts 1-50)
        const limit = parseInt(limitParam, 10);
        if (isNaN(limit) || limit < 1 || limit > 50) {
          return new Response(
            JSON.stringify({ error: 'Invalid limit. Must be a number between 1 and 50.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        spotifyResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        break;
      }

      case 'artist': {
        const artistId = url.searchParams.get('id');
        
        if (!artistId) {
          return new Response(
            JSON.stringify({ error: 'Artist ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        spotifyResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        break;
      }

      case 'top-tracks': {
        const artistId = url.searchParams.get('id');
        const market = url.searchParams.get('market') || 'US';
        
        if (!artistId) {
          return new Response(
            JSON.stringify({ error: 'Artist ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        spotifyResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${market}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported: search, artist, top-tracks' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (!spotifyResponse.ok) {
      const errorText = await spotifyResponse.text();
      console.error('Spotify API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Spotify API error: ${spotifyResponse.status}` }),
        { status: spotifyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    result = await spotifyResponse.json();

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in spotify-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
