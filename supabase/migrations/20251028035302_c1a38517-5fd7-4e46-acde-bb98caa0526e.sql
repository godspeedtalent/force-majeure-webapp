-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Allow public to view active promo codes
CREATE POLICY "Public can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admins can manage promo codes
CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert test promo codes
INSERT INTO public.promo_codes (code, discount_type, discount_value) VALUES
  ('FM-50', 'percentage', 50),
  ('FM-5-OFF', 'flat', 5);

-- Create an index on code for faster lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code) WHERE is_active = true;