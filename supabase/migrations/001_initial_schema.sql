-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE order_status AS ENUM (
  'pending', 'assigned', 'delivered', 'fulfilled', 'cancelled', 'failed'
);

CREATE TYPE event_type AS ENUM (
  'assigned', 'unassigned', 'reassigned', 'delivered', 'failed', 'cancelled'
);

-- Shopify configuration table
CREATE TABLE shopify_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT,
  notify_customer_on_fulfill BOOLEAN DEFAULT TRUE,
  installed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders table
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_order_id BIGINT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  shipping_address JSONB,
  line_items JSONB,
  total_price DECIMAL(10,2),
  status order_status DEFAULT 'pending',
  tracking_code TEXT UNIQUE NOT NULL,
  assigned_rider_id UUID REFERENCES riders(id),
  delivered_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  shopify_fulfillment_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery events table
CREATE TABLE delivery_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES riders(id),
  event_type event_type NOT NULL,
  proof_image_path TEXT,
  notes TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook log table
CREATE TABLE webhook_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  shopify_order_id BIGINT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned_rider ON orders(assigned_rider_id);
CREATE INDEX idx_orders_tracking_code ON orders(tracking_code);
CREATE INDEX idx_orders_shopify_order_id ON orders(shopify_order_id);

CREATE INDEX idx_delivery_events_order_id ON delivery_events(order_id);
CREATE INDEX idx_delivery_events_rider_id ON delivery_events(rider_id);

CREATE INDEX idx_webhook_log_processed ON webhook_log(processed, created_at);
CREATE INDEX idx_webhook_log_shopify_order ON webhook_log(shopify_order_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for orders table
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies (for Supabase Auth)
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;

-- Policy: Riders can only see their own assigned orders
CREATE POLICY "Riders can view their assigned orders"
  ON orders FOR SELECT
  USING (assigned_rider_id = auth.uid()::uuid);

-- Policy: Riders can update delivery status for their orders
CREATE POLICY "Riders can update their assigned orders"
  ON orders FOR UPDATE
  USING (assigned_rider_id = auth.uid()::uuid);

-- Policy: Riders can view their own delivery events
CREATE POLICY "Riders can view their delivery events"
  ON delivery_events FOR SELECT
  USING (rider_id = auth.uid()::uuid);

-- Policy: Riders can insert delivery events for their orders
CREATE POLICY "Riders can create delivery events"
  ON delivery_events FOR INSERT
  WITH CHECK (rider_id = auth.uid()::uuid);

-- Note: Shopify config and webhook_log tables use service role key only
-- No RLS policies needed as they're accessed via API routes with service key
