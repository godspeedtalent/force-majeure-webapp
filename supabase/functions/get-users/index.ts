import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header to verify the user is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Verify the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin - use new role system
    const { data: userRoles } = await supabaseClient.rpc('get_user_roles', {
      user_id_param: user.id,
    });

    const isAdmin = userRoles?.some(
      (r: any) => r.role_name === 'admin' || (Array.isArray(r.permissions) && r.permissions.includes('*'))
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
