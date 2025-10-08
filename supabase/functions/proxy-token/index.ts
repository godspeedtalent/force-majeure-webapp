import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const debugMode = url.searchParams.get('debug') === 'true';

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Request received:', {
        timestamp: new Date().toISOString(),
        url: req.url,
        token: token ? `${token.substring(0, 8)}...` : null,
        method: req.method,
      });
    }

    if (!token) {
      console.error('Missing token parameter');
      if (debugMode) {
        console.log(
          '[PROXY-TOKEN DEBUG] Validation failed: Missing token parameter'
        );
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: '/scavenger?error=invalid_token&token=',
        },
      });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      console.error('Invalid UUID format:', token);
      if (debugMode) {
        console.log(
          '[PROXY-TOKEN DEBUG] Validation failed: Invalid UUID format',
          {
            token,
            regex: uuidRegex.toString(),
          }
        );
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(token)}`,
        },
      });
    }

    // Token is the locationId - validate it exists in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: location, error: locationError } = await supabase
      .from('scavenger_locations')
      .select('id, location_name, is_active')
      .eq('id', token)
      .single();

    if (locationError || !location) {
      console.error('Location not found:', token);
      if (debugMode) {
        console.log('[PROXY-TOKEN DEBUG] Location not found in database:', {
          token,
          error: locationError?.message,
        });
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(token)}`,
        },
      });
    }

    if (!location.is_active) {
      console.error('Location is not active:', token);
      if (debugMode) {
        console.log('[PROXY-TOKEN DEBUG] Location is not active:', {
          token,
          locationName: location.location_name,
        });
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(token)}`,
        },
      });
    }

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Valid location found:', {
        locationId: token,
        locationName: location.location_name,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    console.log(
      'Valid token - redirecting to location:',
      token.substring(0, 8) + '...',
      location.location_name
    );

    // Redirect to scavenger page with locationId (token IS the locationId)
    const redirectUrl = `/scavenger?locationId=${token}${debugMode ? '&debug=true' : ''}`;

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Redirecting to:', redirectUrl);
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirectUrl,
      },
    });
  } catch (error: any) {
    console.error('Error in proxy-token:', error);
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const debugMode = url.searchParams.get('debug') === 'true';

    if (debugMode) {
      console.log('[PROXY-TOKEN DEBUG] Error occurred:', {
        error: error.message,
        stack: error.stack,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `/scavenger?error=proxy_error&token=${encodeURIComponent(token || '')}${debugMode ? '&debug=true' : ''}`,
      },
    });
  }
});
