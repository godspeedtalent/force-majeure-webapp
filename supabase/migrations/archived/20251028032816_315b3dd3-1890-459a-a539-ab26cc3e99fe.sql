-- Remove duplicate ticketing fees (keep 'all' environment, remove 'dev' duplicates)
DELETE FROM public.ticketing_fees 
WHERE environment = 'dev' 
AND fee_name IN ('platform_fee', 'processing_fee', 'sales_tax');