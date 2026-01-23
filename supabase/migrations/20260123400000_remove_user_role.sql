-- Migration: Remove 'user' role from the system
-- The 'user' role is redundant since authentication already implies user status.
-- All authenticated users can access basic functionality without needing a specific role.

-- First, remove any user_roles assignments for the 'user' role
DELETE FROM public.user_roles
WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'user');

-- Then, remove the 'user' role from the roles table
DELETE FROM public.roles WHERE name = 'user';

-- Note: The 'user' value in the app_role enum cannot be easily removed in PostgreSQL
-- without recreating the enum. The value will remain but be unused.
-- This is acceptable as enums can have unused values.
