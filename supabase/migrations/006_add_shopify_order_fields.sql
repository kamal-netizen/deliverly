-- Add additional Shopify order fields for complete order information
ALTER TABLE orders ADD COLUMN IF NOT EXISTS financial_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway_names TEXT[];
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AED';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_price DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_tax DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_discounts DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_url TEXT;

-- Add comment
COMMENT ON COLUMN orders.financial_status IS 'Shopify payment status: pending, authorized, partially_paid, paid, etc.';
COMMENT ON COLUMN orders.fulfillment_status IS 'Shopify fulfillment status: fulfilled, partial, null, restocked';
COMMENT ON COLUMN orders.payment_gateway_names IS 'Array of payment gateways used (Cash on Delivery, Credit Card, etc.)';
COMMENT ON COLUMN orders.currency IS 'Currency code (AED, USD, etc.)';
COMMENT ON COLUMN orders.order_url IS 'Direct link to order in Shopify admin';
