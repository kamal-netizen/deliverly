-- 008: Separate delivery status from fulfillment status
--
-- `orders.status` conflated two independent facts as mutually exclusive values
-- of one column: whether a rider physically delivered the order, and whether
-- Shopify has been told about it.
--
-- The two ingestion paths disagreed about which value to use:
--   * a rider delivering set 'delivered', then fulfillment overwrote it with
--     'fulfilled';
--   * an order imported by sync or the orders/create webhook that Shopify
--     already reported fulfilled was written as 'delivered' with
--     shopify_fulfillment_id left NULL.
--
-- Since shopify_fulfillment_id is the fulfillment idempotency key, that second
-- group stayed permanently eligible to be fulfilled a second time. /api/stats
-- meanwhile counted 'delivered' and 'fulfilled' as separate buckets, so the
-- same lifecycle stage split across two counters depending on how the order
-- arrived.
--
-- After this migration:
--   * status is the delivery lifecycle only:
--       pending | assigned | delivered | cancelled | failed
--   * "fulfilled in Shopify" is exactly `shopify_fulfillment_id IS NOT NULL`.
--
-- Must be applied together with the application code that writes these values.
-- Applying it alone makes lib/fulfillment.ts fail its CHECK on every write.

-- Collapse the old value. These orders were delivered; 'fulfilled' only ever
-- described what happened afterwards in Shopify.
UPDATE orders SET status = 'delivered' WHERE status = 'fulfilled';

-- Postgres cannot remove a value from an enum, so the value stays in the type
-- and a constraint keeps it out of the column.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_not_fulfilled;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_not_fulfilled
  CHECK (status <> 'fulfilled'::order_status);

-- Surface fulfillment failures instead of swallowing them. rider/delivered
-- logged the error to the console and returned success, so an order could sit
-- delivered-but-never-fulfilled with nothing in the UI to say so.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_attempted_at TIMESTAMPTZ;

-- The dashboard's "needs attention" query: delivered, but Shopify does not
-- know it yet.
CREATE INDEX IF NOT EXISTS idx_orders_awaiting_fulfillment
  ON orders (delivered_at DESC)
  WHERE status = 'delivered' AND shopify_fulfillment_id IS NULL;

-- update_rider_stats() compares OLD.status, which is NULL-able, and
-- `NULL != 'delivered'` evaluates to NULL rather than true - so the counter
-- silently skipped those rows. status has had a default since 001 and every
-- write path sets it, so require it.
UPDATE orders SET status = 'pending' WHERE status IS NULL;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- PostgREST caches the schema, including foreign keys, and will not notice
-- anything above until told. Without this, nested selects such as
-- orders -> delivery_events fail with PGRST200 "Could not find a relationship",
-- which looks like a missing foreign key rather than a stale cache.
NOTIFY pgrst, 'reload schema';
