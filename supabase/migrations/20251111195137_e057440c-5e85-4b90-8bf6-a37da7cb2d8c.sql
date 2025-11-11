-- Fix RLS policy on environments table to allow anonymous access
-- This is critical for feature flags to work before authentication

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view environments" ON public.environments;

-- Create new PERMISSIVE policy for anonymous and authenticated reads
CREATE POLICY "Anyone can view environments" 
ON public.environments 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;