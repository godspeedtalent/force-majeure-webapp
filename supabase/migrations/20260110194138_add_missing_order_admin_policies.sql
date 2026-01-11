-- ============================================================================
-- Migration: Add Missing Admin INSERT/UPDATE Policies for Order-Related Tables
-- ============================================================================
-- This migration adds missing RLS policies that allow admins/developers to:
-- 1. INSERT orders (for CSV import of historical orders)
-- 2. INSERT order_items (for CSV import)
-- 3. UPDATE tickets (for status updates, etc.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Orders: Add Admin INSERT Policy
-- ----------------------------------------------------------------------------
-- The orders table currently has admin SELECT, UPDATE, DELETE but NOT INSERT.
-- This is needed for the CSV import tool to create orders for any user or
-- "orphan" orders (user_id = NULL) that link later when users register.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert orders" ON orders;

CREATE POLICY "Admins can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Order Items: Add Admin INSERT Policy
-- ----------------------------------------------------------------------------
-- The order_items table currently has admin SELECT, UPDATE, DELETE but NOT INSERT.
-- This is needed for the CSV import tool to create order line items.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert order_items" ON order_items;

CREATE POLICY "Admins can insert order_items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Tickets: Add Admin UPDATE Policy
-- ----------------------------------------------------------------------------
-- The tickets table has admin SELECT, INSERT, DELETE but NOT UPDATE.
-- This is needed to update ticket status (e.g., mark as used, refunded).
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

CREATE POLICY "Admins can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
  );

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- Table          | Operation | Policy Added
-- ---------------|-----------|-------------------------------------------
-- orders         | INSERT    | Admins/developers can insert any orders
-- order_items    | INSERT    | Admins/developers can insert any order items
-- tickets        | UPDATE    | Admins/developers can update any tickets
-- ============================================================================
