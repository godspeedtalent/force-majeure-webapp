import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get('locationId');
    const debug = url.searchParams.get('debug') === 'true';

    if (debug) {
      console.log('🔍 Validate Location Debug:', {
        timestamp: new Date().toISOString(),
        locationId,
        method: req.method,
        url: req.url,
      });
    }

    if (!locationId) {
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
      .select('id, location_name, location_description, is_active')
      .eq('id', locationId)
      .single();

    if (error) {
      if (debug) {
        console.log('❌ Database query error:', error);
      }

      if (error.code === 'PGRST116') {
        // No rows returned
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

    // Location exists and is active
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

    return new Response(
      JSON.stringify({
        valid: false,
        reason: 'server_error',
        message: 'Internal server error',
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
