-- Migration: Add customer_email to orders and enable orphan order linking
-- This allows orders to be imported without a user_id, and later linked when users sign up

-- Step 1: Make user_id nullable to support orphan orders
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add customer_email column for orphan order matching
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Step 3: Create index for fast email lookups during user registration
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email) WHERE customer_email IS NOT NULL;

-- Step 4: Create function to link orphan orders to newly registered users
CREATE OR REPLACE FUNCTION link_orders_to_user()
RETURNS TRIGGER AS $$
DECLARE
  orders_updated INTEGER;
  tickets_updated INTEGER;
BEGIN
  -- Only proceed if the new profile has an email
  IF NEW.email IS NOT NULL THEN
    -- Update orders with matching customer_email where user_id is null
    UPDATE orders
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE customer_email = LOWER(NEW.email)
      AND user_id IS NULL;

    GET DIAGNOSTICS orders_updated = ROW_COUNT;

    -- Also update tickets associated with these orders
    UPDATE tickets t
    SET updated_at = NOW()
    FROM orders o
    WHERE t.order_id = o.id
      AND o.user_id = NEW.id
      AND o.customer_email = LOWER(NEW.email);

    GET DIAGNOSTICS tickets_updated = ROW_COUNT;

    -- Log the linking action
    IF orders_updated > 0 THEN
      RAISE LOG 'Linked % orders and % tickets to user % with email %',
        orders_updated, tickets_updated, NEW.id, NEW.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to fire on profile creation
DROP TRIGGER IF EXISTS trigger_link_orders_on_profile_create ON profiles;
CREATE TRIGGER trigger_link_orders_on_profile_create
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_orders_to_user();

-- Step 6: Also create a manual function that can be called to link orders for existing users
CREATE OR REPLACE FUNCTION link_orders_for_user(user_email TEXT, user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  orders_updated INTEGER;
BEGIN
  UPDATE orders
  SET user_id = user_uuid,
      updated_at = NOW()
  WHERE customer_email = LOWER(user_email)
    AND user_id IS NULL;

  GET DIAGNOSTICS orders_updated = ROW_COUNT;
  RETURN orders_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for admin use)
GRANT EXECUTE ON FUNCTION link_orders_for_user(TEXT, UUID) TO authenticated;

-- Add comment explaining the customer_email field
COMMENT ON COLUMN orders.customer_email IS 'Email address of the customer. Used to link orphan orders (where user_id is NULL) to users when they later sign up.';
