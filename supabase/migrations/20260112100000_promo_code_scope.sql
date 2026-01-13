-- ============================================
-- PROMO CODE APPLICATION SCOPE
-- Migration: 20260112100000
-- ============================================
-- Adds scope controls for promo codes:
-- - application_scope: which tickets the code applies to
-- - applies_to_order: whether discount applies to whole order or per ticket
-- - Junction tables for group/tier specific codes

-- ============================================
-- 1. ADD APPLICATION SCOPE ENUM TYPE
-- ============================================

DO $$ BEGIN
  CREATE TYPE promo_code_scope AS ENUM ('all_tickets', 'specific_groups', 'specific_tiers', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. ADD NEW COLUMNS TO PROMO_CODES TABLE
-- ============================================

-- Application scope - determines which tickets the code applies to
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS application_scope promo_code_scope DEFAULT 'all_tickets';

-- Applies to order - if true, discount applies once to the entire order
-- If false, discount applies to each qualifying ticket
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS applies_to_order BOOLEAN DEFAULT false;

-- ============================================
-- 3. PROMO_CODE_GROUPS - Junction for group-specific codes
-- ============================================

CREATE TABLE IF NOT EXISTS promo_code_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  ticket_group_id UUID NOT NULL REFERENCES ticket_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, ticket_group_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_code_groups_promo_code_id ON promo_code_groups(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_groups_ticket_group_id ON promo_code_groups(ticket_group_id);

-- Enable RLS
ALTER TABLE promo_code_groups ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON promo_code_groups TO authenticated;
GRANT SELECT ON promo_code_groups TO anon;

-- RLS Policies
CREATE POLICY "Public can view promo code groups"
  ON promo_code_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage promo code groups"
  ON promo_code_groups FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- 4. PROMO_CODE_TIERS - Junction for tier-specific codes
-- ============================================

CREATE TABLE IF NOT EXISTS promo_code_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, ticket_tier_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_code_tiers_promo_code_id ON promo_code_tiers(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_tiers_ticket_tier_id ON promo_code_tiers(ticket_tier_id);

-- Enable RLS
ALTER TABLE promo_code_tiers ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON promo_code_tiers TO authenticated;
GRANT SELECT ON promo_code_tiers TO anon;

-- RLS Policies
CREATE POLICY "Public can view promo code tiers"
  ON promo_code_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage promo code tiers"
  ON promo_code_tiers FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- 5. HELPER FUNCTION - Check if promo code applies to a tier
-- ============================================

CREATE OR REPLACE FUNCTION promo_code_applies_to_tier(
  p_promo_code_id UUID,
  p_ticket_tier_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scope promo_code_scope;
  v_group_id UUID;
BEGIN
  -- Get the promo code's application scope
  SELECT application_scope INTO v_scope
  FROM promo_codes
  WHERE id = p_promo_code_id AND is_active = true;

  IF v_scope IS NULL THEN
    RETURN false;
  END IF;

  -- Check based on scope
  CASE v_scope
    WHEN 'disabled' THEN
      RETURN false;

    WHEN 'all_tickets' THEN
      RETURN true;

    WHEN 'specific_tiers' THEN
      RETURN EXISTS (
        SELECT 1 FROM promo_code_tiers
        WHERE promo_code_id = p_promo_code_id
          AND ticket_tier_id = p_ticket_tier_id
      );

    WHEN 'specific_groups' THEN
      -- Get the tier's group
      SELECT group_id INTO v_group_id
      FROM ticket_tiers
      WHERE id = p_ticket_tier_id;

      IF v_group_id IS NULL THEN
        RETURN false;
      END IF;

      RETURN EXISTS (
        SELECT 1 FROM promo_code_groups
        WHERE promo_code_id = p_promo_code_id
          AND ticket_group_id = v_group_id
      );

    ELSE
      RETURN false;
  END CASE;
END;
$$;
