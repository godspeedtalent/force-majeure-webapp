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
      (r: any) => r.role_name === 'admin' || r.permission_names.includes('*')
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

    // Fetch all users from auth.users using admin API
    const {
      data: { users },
      error: usersError,
    } = await supabaseClient.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    // Fetch profiles and roles for all users
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('*, organization:organizations(id, name)');

    // Fetch all user roles with role details using RPC
    const allUserIds = users.map(u => u.id);
    const allUserRolesPromises = allUserIds.map(async userId => {
      const { data } = await supabaseClient.rpc('get_user_roles', {
        user_id_param: userId,
      });
      return { userId, roles: data || [] };
    });

    const allUserRolesData = await Promise.all(allUserRolesPromises);
    const userRolesMap = new Map(
      allUserRolesData.map(({ userId, roles }) => [userId, roles])
    );

    // Combine data - return role names instead of single role
    const enrichedUsers = users.map(authUser => {
      const profile = profiles?.find(p => p.user_id === authUser.id);
      const roles = userRolesMap.get(authUser.id) || [];

      return {
        id: authUser.id,
        email: authUser.email,
        display_name: profile?.display_name || '',
        full_name: profile?.full_name || '',
        created_at: authUser.created_at,
        organization_id: profile?.organization_id || null,
        organization: profile?.organization || null,
        roles: roles.map((r: any) => ({
          role_name: r.role_name,
          display_name: r.display_name,
          permissions: r.permission_names,
        })),
        is_public: profile?.is_public || false,
        show_on_leaderboard: profile?.show_on_leaderboard || false,
        last_sign_in: authUser.last_sign_in_at,
        confirmed_at: authUser.confirmed_at,
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
