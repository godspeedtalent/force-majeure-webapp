-- Migration: Fix headliner_id constraint name
-- Created: 2025-11-11
-- Description: Ensures the foreign key constraint has the expected name for queries

-- Drop the existing constraint (if it exists with auto-generated name)
DO $$
BEGIN
  -- Try to drop auto-generated constraint name
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_headliner_id_fkey' 
    AND table_name = 'events'
  ) THEN
    -- Constraint already has the correct name, do nothing
    RAISE NOTICE 'Constraint already has correct name';
  ELSE
    -- Find and drop the auto-generated constraint
    EXECUTE (
      SELECT 'ALTER TABLE public.events DROP CONSTRAINT IF EXISTS ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'events'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%headliner_id%'
      LIMIT 1
    );
    
    -- Add constraint with explicit name
    ALTER TABLE public.events
      ADD CONSTRAINT events_headliner_id_fkey 
      FOREIGN KEY (headliner_id) 
      REFERENCES public.artists(id) 
      ON DELETE SET NULL;
  END IF;
END $$;
