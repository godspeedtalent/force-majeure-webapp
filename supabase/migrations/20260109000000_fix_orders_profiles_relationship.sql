-- Migration: Fix orders to profiles relationship
-- Description: Adds a foreign key from orders.user_id to profiles.id
-- to enable PostgREST joins for fetching user information with orders

-- Add foreign key constraint from orders.user_id to profiles.id
-- This enables the join syntax: profiles!orders_user_id_profiles_fkey(...)
-- The constraint is named explicitly for clarity in PostgREST queries
ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_profiles_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Add comment explaining the dual relationship
COMMENT ON CONSTRAINT orders_user_id_profiles_fkey ON orders IS
  'Foreign key to profiles for PostgREST joins. user_id also references auth.users for RLS.';
