-- Create businesses table for caching business information
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  category text,
  rating numeric(2, 1),
  price_level integer,
  business_hours jsonb,
  website text,
  pricing_data jsonb,
  last_called_at timestamp with time zone,
  cached_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON businesses(place_id);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_cached_at ON businesses(cached_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_last_called_at ON businesses(last_called_at DESC);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (businesses are public, anyone can read, only system can write)
CREATE POLICY "Anyone can view businesses"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role can update businesses"
  ON businesses FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE businesses IS 'Cached business information from Google Places API and call history';
COMMENT ON COLUMN businesses.place_id IS 'Google Places API place ID';
COMMENT ON COLUMN businesses.pricing_data IS 'Cached pricing information from calls or website scraping';
COMMENT ON COLUMN businesses.last_called_at IS 'Last time this business was called by the AI concierge';
COMMENT ON COLUMN businesses.cached_at IS 'When this business info was last updated';

-- Create price_quotes table for storing individual quotes
CREATE TABLE IF NOT EXISTS price_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  business_id uuid REFERENCES businesses,
  call_id uuid REFERENCES call_history,
  item_description text NOT NULL,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  price_type text, -- 'fixed', 'hourly', 'per_unit', 'range', 'starting_at'
  conditions jsonb, -- array of strings
  fees jsonb, -- array of { name, amount }
  discounts jsonb, -- array of { description, amount }
  total_price numeric,
  valid_until timestamp with time zone,
  confidence numeric(3, 2), -- 0.00 to 1.00
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for price_quotes
CREATE INDEX IF NOT EXISTS idx_price_quotes_user_id ON price_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_business_id ON price_quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_call_id ON price_quotes(call_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_created_at ON price_quotes(created_at DESC);

-- Enable RLS on price_quotes
ALTER TABLE price_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_quotes
CREATE POLICY "Users can view own price_quotes"
  ON price_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price_quotes"
  ON price_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price_quotes"
  ON price_quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own price_quotes"
  ON price_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for price_quotes
COMMENT ON TABLE price_quotes IS 'Individual price quotes gathered from AI calls';
COMMENT ON COLUMN price_quotes.confidence IS 'AI confidence in price extraction (0.00 to 1.00)';
COMMENT ON COLUMN price_quotes.valid_until IS 'How long this quote is valid';

-- Create updated_at trigger for businesses
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_timestamp
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();

-- Create updated_at trigger for price_quotes
CREATE OR REPLACE FUNCTION update_price_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_price_quotes_timestamp
  BEFORE UPDATE ON price_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_price_quotes_updated_at();
















