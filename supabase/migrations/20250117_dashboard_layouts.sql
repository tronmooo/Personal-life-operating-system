-- Create dashboard_layouts table for storing custom dashboard configurations
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Layout details
  layout_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Layout configuration (JSON)
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active layout per user
  CONSTRAINT unique_active_layout UNIQUE (user_id, is_active) WHERE is_active = TRUE
);

-- Create indexes
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_is_active ON dashboard_layouts(is_active);

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own layouts"
  ON dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layouts"
  ON dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layouts"
  ON dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own layouts"
  ON dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_layouts_updated_at();

-- Function to ensure only one active layout per user
CREATE OR REPLACE FUNCTION ensure_single_active_layout()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a layout to active, deactivate all others for this user
  IF NEW.is_active = TRUE THEN
    UPDATE dashboard_layouts
    SET is_active = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single active layout
CREATE TRIGGER ensure_single_active_layout_trigger
  BEFORE INSERT OR UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_layout();

-- Insert default layouts for new users (optional)
-- This will be handled by the application






























