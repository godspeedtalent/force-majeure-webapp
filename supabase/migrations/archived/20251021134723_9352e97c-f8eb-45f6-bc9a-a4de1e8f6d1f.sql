-- Fix search_path for validation trigger functions created in Migration 1

ALTER FUNCTION validate_ticket_tier_inventory() SET search_path = public;
ALTER FUNCTION validate_order_totals() SET search_path = public;