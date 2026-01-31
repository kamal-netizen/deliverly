# Apply Shopify Order Fields Migration

## Instructions

1. Open Supabase SQL Editor: https://app.supabase.com
2. **Copy ONLY the SQL code below** (from `ALTER TABLE` to the last `COMMENT ON`)
3. Paste and run in SQL Editor

⚠️ **Important**: Copy only the SQL commands, NOT the markdown formatting or code block markers!

---

## SQL Migration (Copy from here ↓)

```sql
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

-- Add comments
COMMENT ON COLUMN orders.financial_status IS 'Shopify payment status: pending, authorized, partially_paid, paid, etc.';
COMMENT ON COLUMN orders.fulfillment_status IS 'Shopify fulfillment status: fulfilled, partial, null, restocked';
COMMENT ON COLUMN orders.payment_gateway_names IS 'Array of payment gateways used (Cash on Delivery, Credit Card, etc.)';
COMMENT ON COLUMN orders.currency IS 'Currency code (AED, USD, etc.)';
COMMENT ON COLUMN orders.order_url IS 'Direct link to order in Shopify admin';
```

## What This Adds

### Payment Information
- **financial_status**: paid, pending, refunded, etc.
- **payment_gateway_names**: ["Cash on Delivery (COD)"] or ["Credit Card"]
- **currency**: AED, USD, etc.

### Pricing Details
- **subtotal_price**: Order subtotal before tax/discounts
- **total_tax**: Total tax amount
- **total_discounts**: Total discounts applied

### Additional Info
- **tags**: Shopify order tags for categorization
- **note**: Customer or admin notes
- **order_url**: Direct link to view order in Shopify Admin

## After Migration

1. **Re-sync orders** from Shopify to populate new fields:
   - Go to Dashboard
   - Click "Sync Orders from Shopify"
   
2. **New orders** will automatically include all this data via webhooks

## Order Details Now Show

✅ Customer name, phone, email, address
✅ Complete line items with SKU, variants, quantities
✅ Subtotal, tax, discounts breakdown
✅ Payment status (Paid/Pending)
✅ Payment method (COD badge if applicable)
✅ Fulfillment status
✅ Order notes and tags
✅ Link to Shopify Admin
