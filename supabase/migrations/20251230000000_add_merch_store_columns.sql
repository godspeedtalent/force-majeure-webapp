-- Migration: Add merch store columns to products table
-- Purpose: Support inventory tracking, categories, and merch-specific fields

-- ============================================================================
-- ADD STOCK MANAGEMENT COLUMNS
-- ============================================================================
DO $$
BEGIN
  -- Add stock_quantity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT NULL;
  END IF;

  -- Add track_inventory column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'track_inventory'
  ) THEN
    ALTER TABLE products ADD COLUMN track_inventory BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add low_stock_threshold column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
  END IF;

  -- Add allow_backorder column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'allow_backorder'
  ) THEN
    ALTER TABLE products ADD COLUMN allow_backorder BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN products.stock_quantity IS 'Current stock count. NULL means unlimited when track_inventory=false.';
COMMENT ON COLUMN products.track_inventory IS 'Whether to track and enforce inventory limits';
COMMENT ON COLUMN products.low_stock_threshold IS 'Threshold for low stock warnings (default 5)';
COMMENT ON COLUMN products.allow_backorder IS 'Allow orders when out of stock';

-- ============================================================================
-- ADD MERCH-SPECIFIC COLUMNS
-- ============================================================================
DO $$
BEGIN
  -- Add image_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;

  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category TEXT;
  END IF;

  -- Add sku column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'sku'
  ) THEN
    ALTER TABLE products ADD COLUMN sku TEXT;
  END IF;

  -- Add sort_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN products.image_url IS 'Product image URL';
COMMENT ON COLUMN products.category IS 'Product category for filtering on merch page';
COMMENT ON COLUMN products.sku IS 'Stock keeping unit identifier';
COMMENT ON COLUMN products.sort_order IS 'Display order on merch page (lower = first)';

-- ============================================================================
-- ADD CATEGORY CONSTRAINT
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_category_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_category_check
    CHECK (category IS NULL OR category IN (
      'apparel',           -- T-shirts, hoodies, etc.
      'prints',            -- Limited edition prints
      'stickers',          -- Stickers, decals
      'accessories',       -- Hats, pins, bags
      'vinyl',             -- Records, vinyl
      'digital',           -- Digital downloads
      'collectibles',      -- Limited edition items
      'other'
    ));
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity) WHERE track_inventory = true;

-- ============================================================================
-- STOCK DECREMENT FUNCTION
-- ============================================================================
-- Function to safely decrement stock during checkout
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
  v_tracks_inventory BOOLEAN;
  v_allows_backorder BOOLEAN;
BEGIN
  -- Get current stock info
  SELECT stock_quantity, track_inventory, allow_backorder
  INTO v_current_stock, v_tracks_inventory, v_allows_backorder
  FROM products
  WHERE id = p_product_id;

  -- If product not found
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- If not tracking inventory, always succeed
  IF NOT v_tracks_inventory THEN
    RETURN true;
  END IF;

  -- Check if enough stock (or backorder allowed)
  IF v_current_stock < p_quantity AND NOT v_allows_backorder THEN
    RETURN false;
  END IF;

  -- Decrement stock
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN true;
END;
$$;

-- ============================================================================
-- STOCK INCREMENT FUNCTION (for returns/cancellations)
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stock
  UPDATE products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
  AND track_inventory = true;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_stock(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- SEED SAMPLE MERCH PRODUCTS (for testing)
-- ============================================================================
-- Only insert if no merch products exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM products WHERE type = 'merchandise'
  ) THEN
    INSERT INTO products (name, description, type, price_cents, is_active, category, image_url, track_inventory, stock_quantity, low_stock_threshold, sort_order, metadata)
    VALUES
      ('Force Majeure Logo Tee', 'Premium cotton t-shirt with embroidered Force Majeure logo. Available in black.', 'merchandise', 3500, true, 'apparel', NULL, true, 50, 10, 1, '{"sizes": ["S", "M", "L", "XL", "XXL"]}'::jsonb),
      ('Limited Edition Event Print', 'Numbered art print from our signature events. 18x24 inches on archival paper.', 'merchandise', 7500, true, 'prints', NULL, true, 25, 5, 2, '{"dimensions": "18x24 inches", "material": "Archival paper"}'::jsonb),
      ('Force Majeure Sticker Pack', 'Set of 5 premium vinyl stickers featuring event artwork.', 'merchandise', 1200, true, 'stickers', NULL, true, 100, 20, 3, '{"quantity": 5}'::jsonb),
      ('FM Snapback Cap', 'Adjustable snapback with embroidered FM logo.', 'merchandise', 2800, true, 'accessories', NULL, true, 30, 5, 4, '{"color": "Black"}'::jsonb),
      ('Event Vinyl Record', 'Limited pressing featuring sets from our flagship events.', 'merchandise', 4500, true, 'vinyl', NULL, true, 15, 3, 5, '{"format": "12\" vinyl", "speed": "33 RPM"}'::jsonb),
      ('Digital Wallpaper Pack', 'High-resolution wallpapers for desktop and mobile.', 'merchandise', 500, true, 'digital', NULL, false, NULL, NULL, 6, '{"resolutions": ["4K", "1080p", "Mobile"]}'::jsonb);
  END IF;
END $$;
