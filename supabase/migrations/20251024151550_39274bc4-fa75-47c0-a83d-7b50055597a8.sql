-- Add event_checkout_timer feature flag (dev only)
-- Only insert if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.feature_flags WHERE flag_name = 'event_checkout_timer'
  ) THEN
    INSERT INTO public.feature_flags (flag_name, is_enabled, environment, description)
    VALUES ('event_checkout_timer', true, 'dev', 'Enable countdown timer for ticket holds during checkout (9 minute duration)');
  END IF;
END $$;