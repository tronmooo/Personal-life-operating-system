-- Universal Data Sharing System Migration
-- Creates tables for shareable links, analytics, and access control

-- Shared Links Table
CREATE TABLE IF NOT EXISTS shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What's being shared
  domain text NOT NULL,
  entry_ids text[] NOT NULL, -- Array of domain_entry IDs
  title text,
  description text,
  
  -- Access Control
  share_token text UNIQUE NOT NULL,
  access_type text NOT NULL DEFAULT 'public', -- 'public', 'password', 'email-only'
  password_hash text,
  allowed_emails text[], -- For email-only access
  
  -- Expiration & Limits
  expires_at timestamptz,
  max_views integer,
  view_count integer DEFAULT 0,
  
  -- Settings
  allow_download boolean DEFAULT true,
  show_metadata boolean DEFAULT true,
  watermark text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz
);

-- Share Analytics Table
CREATE TABLE IF NOT EXISTS share_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_link_id uuid REFERENCES shared_links(id) ON DELETE CASCADE,
  
  -- Viewer Info
  viewer_email text,
  viewer_ip text,
  viewer_location jsonb, -- { country, city, etc }
  device_info jsonb, -- { browser, os, device_type }
  
  -- Activity
  action text NOT NULL, -- 'view', 'download', 'export'
  action_details jsonb,
  
  -- Timestamp
  viewed_at timestamptz DEFAULT now()
);

-- Share Templates Table (for pre-configured sharing scenarios)
CREATE TABLE IF NOT EXISTS share_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template Info
  name text NOT NULL,
  description text,
  domain text NOT NULL,
  
  -- Template Config
  format text NOT NULL, -- 'pdf', 'csv', 'excel', 'json'
  filters jsonb, -- Domain-specific filters
  fields text[], -- Which fields to include
  template_style text, -- 'professional', 'minimal', 'detailed'
  
  -- Settings
  is_public boolean DEFAULT false,
  use_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_links(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_links_domain ON shared_links(domain);
CREATE INDEX IF NOT EXISTS idx_shared_links_expires_at ON shared_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_analytics_link_id ON share_analytics(shared_link_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_viewed_at ON share_analytics(viewed_at);
CREATE INDEX IF NOT EXISTS idx_share_templates_user_id ON share_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_share_templates_domain ON share_templates(domain);

-- Row Level Security Policies
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_templates ENABLE ROW LEVEL SECURITY;

-- Shared Links Policies
CREATE POLICY "Users can view their own shared links"
  ON shared_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared links"
  ON shared_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared links"
  ON shared_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared links"
  ON shared_links FOR DELETE
  USING (auth.uid() = user_id);

-- Share Analytics Policies (only owners can view analytics)
CREATE POLICY "Users can view analytics for their shared links"
  ON share_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_links
      WHERE shared_links.id = share_analytics.shared_link_id
      AND shared_links.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON share_analytics FOR INSERT
  WITH CHECK (true); -- Public viewing creates analytics

-- Share Templates Policies
CREATE POLICY "Users can view their own templates"
  ON share_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create templates"
  ON share_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON share_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON share_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_shared_links_timestamp
  BEFORE UPDATE ON shared_links
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_links_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count(link_token text)
RETURNS void AS $$
BEGIN
  UPDATE shared_links
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE share_token = link_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if link is still valid
CREATE OR REPLACE FUNCTION is_share_link_valid(link_token text)
RETURNS boolean AS $$
DECLARE
  link_record shared_links;
BEGIN
  SELECT * INTO link_record
  FROM shared_links
  WHERE share_token = link_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check expiration
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  -- Check view limit
  IF link_record.max_views IS NOT NULL AND link_record.view_count >= link_record.max_views THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE shared_links IS 'Stores shareable links for domain entries with access control';
COMMENT ON TABLE share_analytics IS 'Tracks views and interactions with shared links';
COMMENT ON TABLE share_templates IS 'Pre-configured sharing templates for common scenarios';
COMMENT ON FUNCTION increment_share_view_count IS 'Safely increments view count for a shared link';
COMMENT ON FUNCTION is_share_link_valid IS 'Checks if a share link is still valid (not expired, under view limit)';

