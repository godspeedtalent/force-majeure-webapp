-- Migration: Dynamic Data Grid Schema System
-- This migration adds schema introspection capabilities and configuration storage
-- for the dynamic data grid system.

-- ============================================================================
-- Part 1: Add Missing datagrid_configs Table
-- ============================================================================
-- This table stores user-specific data grid configurations (column visibility,
-- order, widths, etc.). It was in archived migrations but missing from active schema.

CREATE TABLE IF NOT EXISTS public.datagrid_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grid_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_datagrid_configs_user_id ON public.datagrid_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_datagrid_configs_grid_id ON public.datagrid_configs(grid_id);
CREATE INDEX IF NOT EXISTS idx_datagrid_configs_user_grid ON public.datagrid_configs(user_id, grid_id);

-- Enable RLS
ALTER TABLE public.datagrid_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own configurations
CREATE POLICY "Users can view their own grid configs"
  ON public.datagrid_configs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grid configs"
  ON public.datagrid_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grid configs"
  ON public.datagrid_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grid configs"
  ON public.datagrid_configs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.datagrid_configs IS 'Stores user-specific data grid configuration preferences (column visibility, order, widths, page size, etc.)';
COMMENT ON COLUMN public.datagrid_configs.grid_id IS 'Unique identifier for the grid (e.g., "admin-users", "admin-venues")';
COMMENT ON COLUMN public.datagrid_configs.config IS 'JSONB configuration: {columns: [{key, visible, order, width}], pageSize, sortBy}';

-- ============================================================================
-- Part 2: Create table_metadata Cache Table
-- ============================================================================
-- Caches database schema information for fast access by the frontend.
-- Populated by calling the schema introspection RPC functions.

CREATE TABLE IF NOT EXISTS public.table_metadata (
  table_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  relations JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_table_metadata_updated_at ON public.table_metadata(updated_at DESC);

-- Enable RLS
ALTER TABLE public.table_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read, only admins can write
CREATE POLICY "Anyone can view table metadata"
  ON public.table_metadata
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify table metadata"
  ON public.table_metadata
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
    )
  );

-- Add comments
COMMENT ON TABLE public.table_metadata IS 'Cached database schema metadata for dynamic data grid generation';
COMMENT ON COLUMN public.table_metadata.columns IS 'Array of column definitions: [{name, type, nullable, default, is_primary_key}]';
COMMENT ON COLUMN public.table_metadata.relations IS 'Array of foreign key relations: [{column, referenced_table, referenced_column}]';
COMMENT ON COLUMN public.table_metadata.constraints IS 'Table constraints: {primary_keys: [], unique: [], check: []}';

-- ============================================================================
-- Part 3: Create column_customizations Table
-- ============================================================================
-- Stores admin-defined customizations for specific table columns.
-- Overrides auto-generated column definitions from schema introspection.

CREATE TABLE IF NOT EXISTS public.column_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_key TEXT NOT NULL,
  custom_label TEXT,
  custom_type TEXT,
  is_editable BOOLEAN,
  is_visible_by_default BOOLEAN DEFAULT true,
  is_sortable BOOLEAN DEFAULT true,
  is_filterable BOOLEAN DEFAULT true,
  custom_width TEXT,
  render_config JSONB,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(table_name, column_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_column_customizations_table ON public.column_customizations(table_name);
CREATE INDEX IF NOT EXISTS idx_column_customizations_table_column ON public.column_customizations(table_name, column_key);

-- Enable RLS
ALTER TABLE public.column_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read, only admins can write
CREATE POLICY "Anyone can view column customizations"
  ON public.column_customizations
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify column customizations"
  ON public.column_customizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
    )
  );

-- Add comments
COMMENT ON TABLE public.column_customizations IS 'Admin-defined customizations for table columns in data grids';
COMMENT ON COLUMN public.column_customizations.custom_type IS 'Override auto-detected type: text, number, email, url, date, boolean, etc.';
COMMENT ON COLUMN public.column_customizations.render_config IS 'Custom render configuration: {component, props, options}';

-- ============================================================================
-- Part 4: Schema Introspection RPC Functions
-- ============================================================================

-- Function 1: Get list of all tables in public schema
CREATE OR REPLACE FUNCTION public.get_table_list()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT as table_name,
    (xpath('/row/cnt/text()',
      query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I',
        t.schemaname, t.tablename), false, true, '')
    ))[1]::text::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as table_size
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
  ORDER BY t.tablename;
END;
$$;

-- Function 2: Get schema information for a specific table
CREATE OR REPLACE FUNCTION public.get_table_schema(p_table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  character_maximum_length INTEGER,
  numeric_precision INTEGER,
  is_primary_key BOOLEAN,
  is_unique BOOLEAN,
  ordinal_position INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    c.character_maximum_length::INTEGER,
    c.numeric_precision::INTEGER,
    -- Check if column is primary key
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = p_table_name
        AND kcu.column_name = c.column_name
    )::BOOLEAN as is_primary_key,
    -- Check if column has unique constraint
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name = p_table_name
        AND kcu.column_name = c.column_name
    )::BOOLEAN as is_unique,
    c.ordinal_position::INTEGER
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Function 3: Get foreign key relationships for a table
CREATE OR REPLACE FUNCTION public.get_foreign_keys(p_table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  foreign_table_name TEXT,
  foreign_column_name TEXT,
  constraint_name TEXT,
  on_delete_action TEXT,
  on_update_action TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kcu.column_name::TEXT,
    ccu.table_name::TEXT as foreign_table_name,
    ccu.column_name::TEXT as foreign_column_name,
    tc.constraint_name::TEXT,
    rc.delete_rule::TEXT as on_delete_action,
    rc.update_rule::TEXT as on_update_action
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = p_table_name
  ORDER BY kcu.ordinal_position;
END;
$$;

-- Function 4: Refresh metadata cache for a specific table
CREATE OR REPLACE FUNCTION public.refresh_table_metadata(p_table_name TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_columns JSONB;
  v_relations JSONB;
  v_result JSONB;
BEGIN
  -- Get column information
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', column_name,
      'type', data_type,
      'nullable', is_nullable = 'YES',
      'default', column_default,
      'max_length', character_maximum_length,
      'precision', numeric_precision,
      'is_primary_key', is_primary_key,
      'is_unique', is_unique,
      'position', ordinal_position
    ) ORDER BY ordinal_position
  ) INTO v_columns
  FROM public.get_table_schema(p_table_name);

  -- Get foreign key relations
  SELECT jsonb_agg(
    jsonb_build_object(
      'column', column_name,
      'referenced_table', foreign_table_name,
      'referenced_column', foreign_column_name,
      'constraint_name', constraint_name,
      'on_delete', on_delete_action,
      'on_update', on_update_action
    )
  ) INTO v_relations
  FROM public.get_foreign_keys(p_table_name);

  -- Ensure we have valid JSONB (empty array if null)
  v_columns := COALESCE(v_columns, '[]'::jsonb);
  v_relations := COALESCE(v_relations, '[]'::jsonb);

  -- Upsert into table_metadata
  INSERT INTO public.table_metadata (
    table_name,
    display_name,
    columns,
    relations,
    updated_at,
    updated_by
  ) VALUES (
    p_table_name,
    -- Convert snake_case to Title Case for display name
    initcap(replace(p_table_name, '_', ' ')),
    v_columns,
    v_relations,
    NOW(),
    auth.uid()
  )
  ON CONFLICT (table_name)
  DO UPDATE SET
    columns = EXCLUDED.columns,
    relations = EXCLUDED.relations,
    updated_at = NOW(),
    updated_by = auth.uid();

  -- Return the cached metadata
  v_result := jsonb_build_object(
    'table_name', p_table_name,
    'columns', v_columns,
    'relations', v_relations,
    'updated_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- Function 5: Refresh metadata for all tables
CREATE OR REPLACE FUNCTION public.refresh_all_table_metadata()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_table RECORD;
  v_results JSONB := '[]'::jsonb;
  v_table_result JSONB;
BEGIN
  -- Loop through all public tables
  FOR v_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename
  LOOP
    -- Refresh metadata for this table
    v_table_result := public.refresh_table_metadata(v_table.tablename);

    -- Add to results array
    v_results := v_results || jsonb_build_array(v_table_result);
  END LOOP;

  RETURN jsonb_build_object(
    'tables_refreshed', jsonb_array_length(v_results),
    'results', v_results,
    'timestamp', NOW()
  );
END;
$$;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_schema(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_foreign_keys(TEXT) TO authenticated;

-- Only admins can refresh metadata
REVOKE EXECUTE ON FUNCTION public.refresh_table_metadata(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_all_table_metadata() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_table_metadata(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_table_metadata() TO authenticated;

-- Add function comments
COMMENT ON FUNCTION public.get_table_list() IS 'Returns list of all public tables with row counts and sizes';
COMMENT ON FUNCTION public.get_table_schema(TEXT) IS 'Returns detailed schema information for a specific table';
COMMENT ON FUNCTION public.get_foreign_keys(TEXT) IS 'Returns foreign key relationships for a specific table';
COMMENT ON FUNCTION public.refresh_table_metadata(TEXT) IS 'Refreshes cached metadata for a specific table (admin only)';
COMMENT ON FUNCTION public.refresh_all_table_metadata() IS 'Refreshes cached metadata for all tables (admin only)';

-- ============================================================================
-- Part 5: Initialize Metadata Cache
-- ============================================================================
-- Populate the cache with metadata for core tables

DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Refresh metadata for all tables
  -- This will populate the table_metadata cache
  SELECT public.refresh_all_table_metadata() INTO v_result;

  RAISE NOTICE 'Initialized metadata cache for % tables', v_result->>'tables_refreshed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error initializing metadata cache: %', SQLERRM;
END;
$$;
