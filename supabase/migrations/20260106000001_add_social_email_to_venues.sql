-- Add social_email column to venues table
-- This allows venues to display a contact email in their social links section

ALTER TABLE venues ADD COLUMN IF NOT EXISTS social_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN venues.social_email IS 'Contact email address for the venue, displayed in social links section';
