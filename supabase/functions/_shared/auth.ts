/**
 * Shared authentication utilities for Edge Functions
 *
 * Provides centralized auth verification, role checking, and permission validation.
 */

import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

/**
 * UserRole interface matching get_user_roles() RPC return type
 */
interface UserRole {
  role_name: string;
  display_name: string;
  permission_names: string[];
}

/**
 * Verify user authentication from request
 * Throws error if authentication fails
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized: No authentication header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Server configuration error: Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Invalid authentication token');
  }

  return { user, supabase };
}

/**
 * Get user roles using the get_user_roles() RPC function
 * This properly joins user_roles with roles table
 */
async function getUserRoles(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole[]> {
  const { data, error } = await supabase.rpc('get_user_roles', {
    user_id_param: userId,
  });

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return (data || []) as UserRole[];
}

/**
 * Check if user has admin role
 * Admins bypass all permission and role checks
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const roles = await getUserRoles(supabase, userId);
  return roles.some(role => role.role_name === 'admin');
}

/**
 * Require specific role for operation
 * Admins automatically pass this check
 * Throws error if user doesn't have required role
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  roleName: string
): Promise<void> {
  const roles = await getUserRoles(supabase, userId);

  // Check if user is admin first (admins bypass all checks)
  if (roles.some(role => role.role_name === 'admin')) {
    return;
  }

  const hasRole = roles.some(role => role.role_name === roleName);
  if (!hasRole) {
    throw new Error(`Forbidden: Requires ${roleName} role`);
  }
}

/**
 * Require any of the specified roles
 * Admins automatically pass this check
 */
export async function requireAnyRole(
  supabase: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<void> {
  const roles = await getUserRoles(supabase, userId);

  // Check if user is admin first
  if (roles.some(role => role.role_name === 'admin')) {
    return;
  }

  const hasAnyRole = roles.some(role => roleNames.includes(role.role_name));
  if (!hasAnyRole) {
    throw new Error(`Forbidden: Requires one of roles: ${roleNames.join(', ')}`);
  }
}

/**
 * Require specific permission for operation
 * Admins automatically pass this check
 * Throws error if user doesn't have permission
 */
export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  permission: string
): Promise<void> {
  // Check if user is admin first
  const adminCheck = await isAdmin(supabase, userId);
  if (adminCheck) {
    return;
  }

  const { data } = await supabase
    .from('user_permissions')
    .select('permission')
    .eq('user_id', userId)
    .or(`permission.eq.${permission},permission.eq.*`)
    .maybeSingle();

  if (!data) {
    throw new Error(`Forbidden: Requires ${permission} permission`);
  }
}

/**
 * Require any of the specified permissions
 * Admins automatically pass this check
 */
export async function requireAnyPermission(
  supabase: SupabaseClient,
  userId: string,
  permissions: string[]
): Promise<void> {
  // Check if user is admin first
  const adminCheck = await isAdmin(supabase, userId);
  if (adminCheck) {
    return;
  }

  const { data } = await supabase
    .from('user_permissions')
    .select('permission')
    .eq('user_id', userId)
    .or(`permission.eq.*,${permissions.map(p => `permission.eq.${p}`).join(',')}`);

  if (!data || data.length === 0) {
    throw new Error(`Forbidden: Requires one of permissions: ${permissions.join(', ')}`);
  }
}
