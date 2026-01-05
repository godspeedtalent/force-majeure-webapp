-- ============================================
-- CHART_LABELS - Chart-agnostic label persistence
-- ============================================
-- This table stores user-defined labels for data points across any chart type.
-- The design is chart-agnostic: any chart can use this table by providing
-- a unique chart_id and point_id combination.

-- 1. Create table
CREATE TABLE IF NOT EXISTS chart_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Chart identifier (e.g., 'page_views_chart', 'sales_chart', 'conversion_funnel')
  -- This allows the same table to be used for different chart types
  chart_id TEXT NOT NULL,

  -- Data point identifier within the chart (e.g., '2024-01-15', 'event-uuid-123')
  -- This should match the 'id' field from FmLineChartDataPoint or equivalent
  point_id TEXT NOT NULL,

  -- The label text
  label TEXT NOT NULL,

  -- Optional: Color or style for the label marker (hex color or style key)
  marker_color TEXT,

  -- Optional: Additional metadata as JSONB for future extensibility
  -- Can store things like: { "note": "...", "category": "...", "priority": 1 }
  metadata JSONB DEFAULT '{}',

  -- Who created this label (allows user-specific labels if needed)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create unique constraint per chart/point/user combo
-- This allows different users to have different labels for the same data point
CREATE UNIQUE INDEX chart_labels_unique_per_user
  ON chart_labels(chart_id, point_id, created_by);

-- 3. Create index for efficient lookups by chart_id
CREATE INDEX chart_labels_chart_id_idx ON chart_labels(chart_id);

-- 4. Create index for lookups by user
CREATE INDEX chart_labels_created_by_idx ON chart_labels(created_by);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_chart_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chart_labels_updated_at
  BEFORE UPDATE ON chart_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_chart_labels_updated_at();

-- 6. Enable RLS
ALTER TABLE chart_labels ENABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON chart_labels TO authenticated;

-- 8. RLS Policies

-- Users can view their own labels
CREATE POLICY "Users can view own labels"
  ON chart_labels FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Admins can view all labels
CREATE POLICY "Admins can view all labels"
  ON chart_labels FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Users can insert their own labels
CREATE POLICY "Users can insert own labels"
  ON chart_labels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own labels
CREATE POLICY "Users can update own labels"
  ON chart_labels FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Admins can update any labels
CREATE POLICY "Admins can update any labels"
  ON chart_labels FOR UPDATE
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

-- Users can delete their own labels
CREATE POLICY "Users can delete own labels"
  ON chart_labels FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Admins can delete any labels
CREATE POLICY "Admins can delete any labels"
  ON chart_labels FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 9. Add comment for documentation
COMMENT ON TABLE chart_labels IS 'Stores user-defined labels for data points across all chart types. Chart-agnostic design using chart_id and point_id for flexibility.';
COMMENT ON COLUMN chart_labels.chart_id IS 'Unique identifier for the chart type (e.g., page_views_chart, sales_chart)';
COMMENT ON COLUMN chart_labels.point_id IS 'Identifier for the specific data point within the chart';
COMMENT ON COLUMN chart_labels.marker_color IS 'Optional hex color for the label marker visualization';
COMMENT ON COLUMN chart_labels.metadata IS 'Optional JSONB for extensible properties like notes, categories, priorities';