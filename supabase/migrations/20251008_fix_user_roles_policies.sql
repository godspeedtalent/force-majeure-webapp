-- Add INSERT policy for user_roles so the handle_new_user trigger can insert roles
-- This uses SECURITY DEFINER on the trigger function, so we need to allow inserts from the system
CREATE POLICY "Allow system to insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- Also add a policy to allow authenticated users to view all roles (needed for role checks)
CREATE POLICY "Authenticated users can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);
