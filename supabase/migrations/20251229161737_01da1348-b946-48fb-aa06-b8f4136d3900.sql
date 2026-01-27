-- First ensure the 'all' environment exists
INSERT INTO public.environments (id, name, display_name, description, is_active)
VALUES ('311d3e2e-154d-4f01-8514-706bdfad9f4a', 'all', 'All Environments', 'Default configuration for all environments', true)
ON CONFLICT (id) DO NOTHING;

-- Also ensure other standard environments exist
INSERT INTO public.environments (name, display_name, description, is_active)
VALUES
  ('dev', 'Development', 'Development environment', true),
  ('qa', 'QA/Staging', 'Quality assurance and staging environment', true),
  ('prod', 'Production', 'Production environment', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default ticketing fees for 'all' environment
INSERT INTO public.ticketing_fees (fee_name, fee_type, fee_value, is_active, environment_id)
VALUES
  ('sales_tax', 'percentage', 0, true, '311d3e2e-154d-4f01-8514-706bdfad9f4a'),
  ('processing_fee', 'percentage', 0, true, '311d3e2e-154d-4f01-8514-706bdfad9f4a'),
  ('platform_fee', 'flat', 0, true, '311d3e2e-154d-4f01-8514-706bdfad9f4a')
ON CONFLICT DO NOTHING;