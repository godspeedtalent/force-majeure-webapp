-- Add environment column to ticketing_fees table
ALTER TABLE public.ticketing_fees 
ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'all';

-- Update existing fees to have 'all' environment
UPDATE public.ticketing_fees
SET environment = 'all'
WHERE environment IS NULL;

-- Drop the old unique constraint and add new one with environment
ALTER TABLE public.ticketing_fees
DROP CONSTRAINT IF EXISTS ticketing_fees_fee_name_key;

ALTER TABLE public.ticketing_fees
ADD CONSTRAINT ticketing_fees_fee_name_environment_key UNIQUE (fee_name, environment);

-- Insert dev environment versions of the fees
INSERT INTO public.ticketing_fees (fee_name, fee_type, fee_value, is_active, environment)
SELECT fee_name, fee_type, fee_value, is_active, 'dev'
FROM public.ticketing_fees
WHERE environment = 'all'
ON CONFLICT (fee_name, environment) DO NOTHING;