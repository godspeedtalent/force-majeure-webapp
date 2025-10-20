-- Add admin-only RLS policies to api_logs table
CREATE POLICY "Only admins can view logs"
ON api_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert logs"
ON api_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));