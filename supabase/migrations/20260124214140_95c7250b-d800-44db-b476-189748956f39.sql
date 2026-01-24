-- =====================================================
-- Fix ticketing_sessions RLS - Restrict to service role only
-- =====================================================
-- This migration locks down the ticketing_sessions table
-- so that only the service role (edge functions) can manage sessions.
-- This prevents queue manipulation, session hijacking, and DoS attacks.

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view ticketing sessions" ON public.ticketing_sessions;
DROP POLICY IF EXISTS "Anyone can create ticketing sessions" ON public.ticketing_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.ticketing_sessions;

-- Revoke all permissions from anon and authenticated roles
REVOKE ALL ON public.ticketing_sessions FROM anon;
REVOKE ALL ON public.ticketing_sessions FROM authenticated;

-- Grant full access to service_role only (used by edge functions)
GRANT ALL ON public.ticketing_sessions TO service_role;

-- Create restrictive policies that only allow service_role access
-- Note: service_role bypasses RLS, but we add policies for clarity and defense-in-depth

-- Policy for SELECT: Only admins/developers can view directly, 
-- all other access goes through the edge function
CREATE POLICY "Only admins can view ticketing sessions directly"
  ON public.ticketing_sessions
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer')
  );

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- All session management must go through the ticketing-session edge function
-- which uses service_role and bypasses RLS

-- Add comment explaining the security model
COMMENT ON TABLE public.ticketing_sessions IS 
'Ticketing queue sessions table. 
SECURITY: All INSERT/UPDATE/DELETE operations must go through the ticketing-session edge function.
Direct access is restricted to admins/developers for monitoring only.
This prevents queue manipulation, session hijacking, and DoS attacks.';