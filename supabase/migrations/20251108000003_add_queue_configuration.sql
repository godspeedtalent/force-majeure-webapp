-- Create queue_configurations table for managing ticketing queue settings per event
-- This allows flexible configuration of concurrent user limits and timeout settings

CREATE TABLE IF NOT EXISTS public.queue_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  max_concurrent_users INT NOT NULL DEFAULT 50 CHECK (max_concurrent_users > 0),
  checkout_timeout_minutes INT NOT NULL DEFAULT 9 CHECK (checkout_timeout_minutes > 0),
  session_timeout_minutes INT NOT NULL DEFAULT 30 CHECK (session_timeout_minutes > 0),
  enable_queue BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_queue_configurations_event_id ON public.queue_configurations(event_id);

-- Add RLS policies
ALTER TABLE public.queue_configurations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read queue configurations (needed for public ticketing pages)
CREATE POLICY "Anyone can view queue configurations"
  ON public.queue_configurations
  FOR SELECT
  USING (true);

-- Only admins can insert queue configurations
CREATE POLICY "Admins can create queue configurations"
  ON public.queue_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Only admins can update queue configurations
CREATE POLICY "Admins can update queue configurations"
  ON public.queue_configurations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Only admins can delete queue configurations
CREATE POLICY "Admins can delete queue configurations"
  ON public.queue_configurations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_queue_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_queue_configuration_updated_at
  BEFORE UPDATE ON public.queue_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_configuration_updated_at();

-- Add comment to table
COMMENT ON TABLE public.queue_configurations IS 'Configurable settings for event ticketing queue management. Controls concurrent user limits and timeout durations.';

-- Insert default configuration for testing (optional - can be removed)
-- This is just an example and will only work if you have an event with this ID
-- DELETE FROM public.queue_configurations; -- Uncomment to reset during development
