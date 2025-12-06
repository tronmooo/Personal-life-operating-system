-- Create orders table for AI Concierge order management
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  business_id uuid REFERENCES businesses,
  call_id uuid REFERENCES call_history,
  
  -- Order Details
  order_number text UNIQUE,
  business_name text NOT NULL,
  business_phone text,
  
  -- Items
  items jsonb NOT NULL, -- array of { name, quantity, price, notes }
  
  -- Pricing
  subtotal numeric NOT NULL,
  tax numeric DEFAULT 0,
  delivery_fee numeric DEFAULT 0,
  service_fee numeric DEFAULT 0,
  tip numeric DEFAULT 0,
  total_price numeric NOT NULL,
  currency text DEFAULT 'USD',
  
  -- Delivery/Pickup
  order_type text NOT NULL, -- 'delivery', 'pickup', 'dine-in'
  delivery_address text,
  delivery_instructions text,
  scheduled_time timestamp with time zone,
  estimated_time text, -- "30-40 minutes"
  
  -- Status Tracking
  status text NOT NULL DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivered, cancelled, failed
  confirmation_number text,
  tracking_url text,
  
  -- Order Method
  order_method text NOT NULL, -- 'phone', 'api', 'web', 'manual'
  order_source text, -- 'vapi', 'doordash', 'ubereats', etc.
  
  -- User Preferences
  special_requests text,
  contact_phone text,
  contact_email text,
  
  -- Payment
  payment_method text, -- 'cash', 'card', 'prepaid', etc.
  payment_status text DEFAULT 'pending', -- pending, authorized, paid, failed, refunded
  payment_id text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  notes text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_call_id ON orders(call_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_time ON orders(scheduled_time);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id AND status IN ('pending', 'failed'));

-- Comments
COMMENT ON TABLE orders IS 'AI Concierge orders placed on behalf of users';
COMMENT ON COLUMN orders.items IS 'Array of order items with name, quantity, price, notes';
COMMENT ON COLUMN orders.order_method IS 'How the order was placed: phone (VAPI), api (DoorDash/Uber), web (automation), manual';
COMMENT ON COLUMN orders.status IS 'Order lifecycle: pending → confirmed → preparing → ready → delivered/completed';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Create order_history table for tracking status changes
CREATE TABLE IF NOT EXISTS order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders NOT NULL,
  status text NOT NULL,
  note text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at DESC);

-- Enable RLS on order_history
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order history"
  ON order_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Function to add order history entry automatically
CREATE OR REPLACE FUNCTION add_order_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status)) THEN
    INSERT INTO order_history (order_id, status, note)
    VALUES (NEW.id, NEW.status, 'Status changed to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_order_status_changes
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION add_order_history_entry();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  prefix TEXT := 'ORD';
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  timestamp_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  new_number := prefix || '-' || timestamp_part || '-' || random_part;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Set default order_number if not provided
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();
















