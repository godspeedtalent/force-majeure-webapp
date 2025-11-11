-- Migration: Verify and list foreign key constraints on events table
-- Created: 2025-11-11
-- Description: Debug migration to check constraint names

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  RAISE NOTICE 'Foreign key constraints on events table:';
  
  FOR constraint_record IN 
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE table_name = 'events' 
    AND constraint_type = 'FOREIGN KEY'
  LOOP
    RAISE NOTICE 'Constraint: %', constraint_record.constraint_name;
  END LOOP;
END $$;
