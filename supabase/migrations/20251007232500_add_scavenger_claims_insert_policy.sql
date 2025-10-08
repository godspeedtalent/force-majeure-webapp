-- Add missing INSERT policy for scavenger_claims
-- Users should be able to create claims for themselves

CREATE POLICY "Users can create their own claims"
  ON public.scavenger_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);