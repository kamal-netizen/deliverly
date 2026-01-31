# Quick Start: Fix Order Data

## Issue
Orders showing "Unknown" customer names and missing phone/payment data.

## Solution

### 1. Apply Database Migration (if not done yet)

Open Supabase SQL Editor and run:

```sql
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
```

### 2. Re-Sync All Orders from Shopify

**Go to:** Dashboard → Click "Sync Orders from Shopify" button

This will:
- ✅ Fetch all orders from Shopify again
- ✅ Populate customer names, phones, emails
- ✅ Add payment status (COD vs Paid)
- ✅ Add line items details (SKU, variants)
- ✅ Add pricing breakdown (subtotal, tax, discounts)
- ✅ Skip duplicate orders (won't create duplicates)

### 3. Verify

After sync, orders should show:
- Real customer names (not "Unknown")
- Phone numbers
- Payment method in order details
- Complete product information

### 4. New Orders

All new orders from Shopify webhooks will automatically include all this data.

---

## Troubleshooting

**Orders still showing "Unknown"?**
- Make sure sync completed successfully
- Check Shopify connection in Settings → Integrations
- Verify orders exist in Shopify with customer information

**Assignment errors?**
- Check browser console for detailed error logs
- Verify rider exists and is active
- Try refreshing the page
