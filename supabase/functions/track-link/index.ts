import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeviceInfo {
  browser: string;
  os: string;
  device_type: string;
  is_mobile: boolean;
}

function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'MacOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Detect device type
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua);
  const device_type = isMobile ? 'Mobile' : 'Desktop';
  
  return { browser, os, device_type, is_mobile: isMobile };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing tracking code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch tracking link
    const { data: link, error: linkError } = await supabase
      .from('tracking_links')
      .select('*, events(id)')
      .eq('code', code)
      .single();

    if (linkError || !link) {
      console.error('Link not found:', linkError);
      // Redirect to homepage on invalid code
      return Response.redirect(`${supabaseUrl.replace('https://orgxcrnnecblhuxjfruy.supabase.co', 'https://forcemajeure.app')}`, 302);
    }

    // Validate link is active
    if (!link.is_active) {
      return new Response(
        JSON.stringify({ error: 'This link has been deactivated' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max clicks
    if (link.max_clicks && link.click_count >= link.max_clicks) {
      return new Response(
        JSON.stringify({ error: 'This link has reached its maximum click limit' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request info
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const referrer = req.headers.get('referer') || null;
    const deviceInfo = parseUserAgent(userAgent);

    // Record click
    const { error: clickError } = await supabase
      .from('link_clicks')
      .insert({
        link_id: link.id,
        user_agent: userAgent,
        referrer,
        device_info: deviceInfo,
        clicked_at: new Date().toISOString(),
      });

    if (clickError) {
      console.error('Failed to record click:', clickError);
    }

    // Increment click count
    await supabase
      .from('tracking_links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id);

    // Build destination URL with UTM parameters
    const baseUrl = link.custom_destination_url || 
      `https://forcemajeure.app/event/${link.event_id}`;
    
    const destinationUrl = new URL(baseUrl);
    destinationUrl.searchParams.set('utm_source', link.utm_source);
    destinationUrl.searchParams.set('utm_medium', link.utm_medium);
    destinationUrl.searchParams.set('utm_campaign', link.utm_campaign);
    if (link.utm_content) destinationUrl.searchParams.set('utm_content', link.utm_content);
    if (link.utm_term) destinationUrl.searchParams.set('utm_term', link.utm_term);
    destinationUrl.searchParams.set('tracking_link_id', link.id);

    // Redirect to destination
    return Response.redirect(destinationUrl.toString(), 302);

  } catch (error) {
    console.error('Error processing tracking link:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
