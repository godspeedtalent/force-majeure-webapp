-- Insert default ticketing fees for 'all' environment
INSERT INTO public.ticketing_fees (fee_name, fee_type, fee_value, is_active, environment_id)
VALUES 
  ('sales_tax', 'percentage', 0, true, '311d3e2e-154d-4f01-8514-706bdfad9f4a'),
  ('processing_fee', 'percentage', 0, true, '311d3e2e-154d-4f01-8514-706bdfad9f4a'),
  ('platform_fee', 'flat', 0, true, '311d3e2e-154d-4f01-8514-706bdfad9f4a')
ON CONFLICT DO NOTHING;