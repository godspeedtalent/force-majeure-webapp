-- Create table for site-wide ticketing fees and taxes
CREATE TABLE IF NOT EXISTS public.ticketing_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage')),
  fee_value NUMERIC NOT NULL CHECK (fee_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fee_name)
);

-- Create trigger for updated_at
CREATE TRIGGER update_ticketing_fees_updated_at
  BEFORE UPDATE ON public.ticketing_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fees
INSERT INTO public.ticketing_fees (fee_name, fee_type, fee_value, is_active)
VALUES 
  ('sales_tax', 'percentage', 0, true),
  ('processing_fee', 'percentage', 0, true),
  ('platform_fee', 'flat', 0, true)
ON CONFLICT (fee_name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.ticketing_fees ENABLE ROW LEVEL SECURITY;

-- Public can view active fees
CREATE POLICY "Public can view active fees"
  ON public.ticketing_fees
  FOR SELECT
  USING (is_active = true);

-- Only admins can modify fees
CREATE POLICY "Admins can manage fees"
  ON public.ticketing_fees
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));