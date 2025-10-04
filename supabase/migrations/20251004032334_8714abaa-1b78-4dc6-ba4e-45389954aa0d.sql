-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table to store user roles separately from profiles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check if a user has a specific role
-- This prevents recursive RLS policy issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop the dangerous public UPDATE policy on feature_flags
DROP POLICY IF EXISTS "Public can update feature flags (dev only)" ON public.feature_flags;

-- Create admin-only UPDATE policy for feature_flags
CREATE POLICY "Only admins can update feature flags"
ON public.feature_flags
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin-only INSERT policy for feature_flags
CREATE POLICY "Only admins can insert feature flags"
ON public.feature_flags
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin-only DELETE policy for feature_flags
CREATE POLICY "Only admins can delete feature flags"
ON public.feature_flags
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));