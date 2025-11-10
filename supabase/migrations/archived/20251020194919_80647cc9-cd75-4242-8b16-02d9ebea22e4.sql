-- Add admin-only RLS policies for ticket_tiers table
CREATE POLICY "Admins can insert ticket tiers"
ON ticket_tiers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ticket tiers"
ON ticket_tiers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ticket tiers"
ON ticket_tiers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add server-side validation constraints for profiles table
ALTER TABLE profiles
ADD CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
ADD CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100),
ADD CONSTRAINT phone_format CHECK (phone_number IS NULL OR phone_number ~ '^\(\d{3}\) \d{3}-\d{4}$'),
ADD CONSTRAINT instagram_handle_format CHECK (instagram_handle IS NULL OR (char_length(instagram_handle) <= 30 AND instagram_handle ~ '^[a-zA-Z0-9._]*$'));

-- Fix api_logs RLS policies - remove public exposure
DROP POLICY IF EXISTS "Public can view logs" ON api_logs;
DROP POLICY IF EXISTS "Public can insert logs" ON api_logs;