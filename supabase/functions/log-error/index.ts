/**
 * Error Logging Edge Function
 *
 * Receives error logs from clients and persists them to the error_logs table.
 * Uses the log_error() RPC function which is SECURITY DEFINER.
 *
 * This function is primarily for backwards compatibility.
 * The preferred approach is to use the log_error() RPC directly from the client.
 *
 * SECURITY: Rate limiting is applied to prevent log flooding attacks.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting
// Allows max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    // First request or window expired - reset counter
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Apply rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    console.warn('[log-error] Rate limited:', ip);
    return new Response(
      JSON.stringify({ error: 'Rate limited. Please try again later.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const {
      level = 'error',
      source = 'client',
      endpoint,
      method,
      status,
      message,
      details,
      request_id,
      error_code,
      stack_trace,
      page_url,
      session_id,
      environment,
      app_version,
      metadata,
    } = await req.json();

    const user_agent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use the log_error RPC function
    const { data, error } = await supabase.rpc('log_error', {
      p_level: level,
      p_source: source,
      p_message: message || 'No message provided',
      p_error_code: error_code || null,
      p_endpoint: endpoint || null,
      p_method: method || null,
      p_status_code: status || null,
      p_request_id: request_id || null,
      p_stack_trace: stack_trace || null,
      p_details: details || {},
      p_user_id: null, // Will be auto-filled by auth.uid() in the function
      p_session_id: session_id || null,
      p_user_agent: user_agent || null,
      p_ip_address: ip || null,
      p_page_url: page_url || null,
      p_environment: environment || 'production',
      p_app_version: app_version || null,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('Failed to log error via RPC:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert log', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true, id: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('log-error function failed', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
