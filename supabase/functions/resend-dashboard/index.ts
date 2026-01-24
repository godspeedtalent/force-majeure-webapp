/**
 * Resend Dashboard Edge Function
 *
 * Secure proxy for Resend API calls. Keeps API key server-side.
 * Requires admin or developer role.
 *
 * Endpoints:
 * - ?action=list-emails&limit=50 - List sent emails
 * - ?action=get-email&id=xxx - Get single email details
 * - ?action=list-domains - List configured domains
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  isOriginAllowed,
  createForbiddenResponse,
} from '../_shared/cors.ts';
import { verifyAuth, requireAnyRole } from '../_shared/auth.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

type ResendAction = 'list-emails' | 'get-email' | 'list-domains';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  // Check origin for non-preflight requests
  if (!isOriginAllowed(origin)) {
    return createForbiddenResponse();
  }

  try {
    // SECURITY: Verify user is authenticated and has admin/developer role
    const { user, supabase } = await verifyAuth(req);
    console.log('[resend-dashboard] Auth verified for user:', user.id);

    await requireAnyRole(supabase, user.id, ['admin', 'developer']);
    console.log('[resend-dashboard] Role check passed for user:', user.id);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Parse query parameters
    const url = new URL(req.url);
    const action = url.searchParams.get('action') as ResendAction | null;
    const id = url.searchParams.get('id');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[resend-dashboard] Action:', action, 'Limit:', limit, 'ID:', id);

    let data: unknown;

    switch (action) {
      case 'list-emails': {
        // Fetch emails from Resend API
        // Note: Resend SDK doesn't have a list method, use fetch directly
        const response = await fetch('https://api.resend.com/emails', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[resend-dashboard] Resend API error:', errorText);
          throw new Error(`Resend API error: ${response.status}`);
        }

        data = await response.json();
        break;
      }

      case 'get-email': {
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing id parameter for get-email' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(`https://api.resend.com/emails/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[resend-dashboard] Resend API error:', errorText);
          throw new Error(`Resend API error: ${response.status}`);
        }

        data = await response.json();
        break;
      }

      case 'list-domains': {
        const response = await fetch('https://api.resend.com/domains', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[resend-dashboard] Resend API error:', errorText);
          throw new Error(`Resend API error: ${response.status}`);
        }

        data = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('[resend-dashboard] Success for action:', action);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[resend-dashboard] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle auth errors specifically
    if (errorMessage.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (errorMessage.includes('Forbidden')) {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
