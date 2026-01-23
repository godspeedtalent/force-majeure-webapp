import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { verifyAuth, requireAnyRole } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // SECURITY: Use centralized auth verification
    const { user, supabase: authSupabase } = await verifyAuth(req);
    console.log('[get-users] Auth verified for user:', user.id);

    // Require admin or developer role (admin bypass is automatic)
    await requireAnyRole(authSupabase, user.id, ['admin', 'developer']);
    console.log('[get-users] Role check passed for user:', user.id);

    // Create service role client for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all users using the users_complete view
    // This view joins auth.users, profiles, organizations, and roles in one query
    const { data: users, error: usersError } = await supabaseClient
      .from('users_complete')
      .select('*');

    if (usersError) {
      throw usersError;
    }

    // Transform the data to match the expected format
    const enrichedUsers = users.map((user: any) => {
      // Parse roles JSON to array
      const rolesArray = user.roles || [];

      return {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        created_at: user.auth_created_at,
        organization_id: user.organization_id,
        organization_name: user.organization_name,
        organization: user.organization_name
          ? {
              id: user.organization_id,
              name: user.organization_name,
            }
          : null,
        roles: rolesArray,
        is_verified: user.is_verified || false,
        is_public: false, // Not in view, default to false
        show_on_leaderboard: false, // Not in view, default to false
        last_sign_in: user.last_sign_in_at,
        confirmed_at: user.email_confirmed_at,
      };
    });

    return new Response(JSON.stringify({ users: enrichedUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-users] Error:', error);

    // Handle auth errors specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (errorMessage.includes('Forbidden')) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
