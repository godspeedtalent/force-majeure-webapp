import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || {
    count: 0,
    resetTime: now + RATE_WINDOW,
  };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_WINDOW;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);
  return record.count <= RATE_LIMIT;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    if (!checkRateLimit(ip)) {
      const shouldRedirect = req.url.includes('token=');
      if (shouldRedirect) {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: '/scavenger?error=rate_limit',
          },
        });
      }
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'rate_limit',
          message: 'Too many requests. Please try again in 1 minute.',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);

    // Get token/locationId from either query params or POST body
    // Accept aliases: token, locationId, proxy-token, proxy_token
    let locationId =
      url.searchParams.get('token') ||
      url.searchParams.get('locationId') ||
      url.searchParams.get('proxy-token') ||
      url.searchParams.get('proxy_token');
    let debug = url.searchParams.get('debug') === 'true';
    let shouldRedirect =
      url.searchParams.has('token') ||
      url.searchParams.has('proxy-token') ||
      url.searchParams.has('proxy_token');

    // If not in query params, check POST body
    if (!locationId && req.method === 'POST') {
      try {
        const body = await req.json();
        locationId =
          body.token ||
          body.locationId ||
          body['proxy-token'] ||
          body.proxy_token;
        debug = debug || body.debug === true;
        shouldRedirect = false; // POST requests want JSON response, not redirect
      } catch (e) {
        // Invalid JSON body, continue with null locationId
      }
    }

    if (debug) {
      console.log('🔍 Validate Location Debug:', {
        timestamp: new Date().toISOString(),
        locationId,
        method: req.method,
        url: req.url,
        shouldRedirect,
      });
    }

    if (!locationId) {
      if (shouldRedirect) {
        // Redirect mode - send to scavenger with error
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: '/scavenger?error=invalid_token&token=',
          },
        });
      }

      // API mode - return JSON
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'locationId_required',
          message: 'locationId parameter is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(locationId)) {
      if (debug) {
        console.log('❌ Invalid UUID format:', locationId);
      }

      if (shouldRedirect) {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(locationId)}`,
          },
        });
      }

      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'invalid_format',
          message: 'Invalid locationId format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (debug) {
      console.log('🔍 Checking location in database:', { locationId });
    }

    // Check if location exists in scavenger_locations table
    const { data: location, error } = await supabase
      .from('scavenger_locations')
      .select(
        'id, location_name, location_description, is_active, checkin_count'
      )
      .eq('id', locationId)
      .single();

    if (error) {
      if (debug) {
        console.log('❌ Database query error:', error);
      }

      if (error.code === 'PGRST116') {
        // No rows returned
        if (shouldRedirect) {
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(locationId)}`,
            },
          });
        }

        return new Response(
          JSON.stringify({
            valid: false,
            reason: 'location_not_found',
            message: 'Location does not exist',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Other database error
      throw error;
    }

    if (!location.is_active) {
      if (debug) {
        console.log('❌ Location exists but is inactive:', location);
      }

      if (shouldRedirect) {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: `/scavenger?error=invalid_token&token=${encodeURIComponent(locationId)}`,
          },
        });
      }

      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'location_inactive',
          message: 'Location is not currently active',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (debug) {
      console.log('✅ Location is valid:', location);
    }

    // Increment checkin_count for each scan
    const { error: updateCheckinError } = await supabase
      .from('scavenger_locations')
      .update({ checkin_count: (location.checkin_count ?? 0) + 1 })
      .eq('id', locationId);

    if (updateCheckinError) {
      console.error('Failed to increment checkin_count:', updateCheckinError);
      // Don't fail the validation if counter update fails
    } else if (debug) {
      console.log('�o. Incremented checkin_count');
    }

    // Location exists and is active
    if (shouldRedirect) {
      // Redirect mode - send to scavenger with locationId
      const redirectUrl = `/scavenger?locationId=${locationId}${debug ? '&debug=true' : ''}`;

      if (debug) {
        console.log('🔄 Redirecting to:', redirectUrl);
      }

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: redirectUrl,
        },
      });
    }

    // API mode - return JSON
    return new Response(
      JSON.stringify({
        valid: true,
        locationId: location.id,
        locationName: location.location_name,
        description: location.location_description,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Validate location error:', error);

    const url = new URL(req.url);
    const shouldRedirect = url.searchParams.has('token');
    const locationId =
      url.searchParams.get('token') || url.searchParams.get('locationId');

    if (shouldRedirect) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `/scavenger?error=proxy_error&token=${encodeURIComponent(locationId || '')}`,
        },
      });
    }

    return new Response(
      JSON.stringify({
        valid: false,
        reason: 'server_error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
