-- 010: Orders that were completed by somebody other than this system
--
-- The delivery lifecycle in `status` assumes every order leaves through this
-- app: a rider marks it delivered, or it fails, or it is cancelled. In practice
-- a merchant also fulfils orders by other means - another courier, a walk-in
-- collection, a hand delivery - and those orders never reach any of those
-- states. They sat in the dispatch queue as pending work forever, because from
-- this system's point of view nothing had happened to them.
--
-- There are two ways to learn an order is finished elsewhere:
--
--   1. Shopify says so. That is already recorded: shopify_fulfillment_id is
--      non-null once anything fulfils the order, ours or otherwise. No new
--      column is needed for that case, only code that stops treating those
--      orders as outstanding.
--
--   2. Nobody recorded it anywhere. Shopify does not know either, so no amount
--      of syncing will ever reveal it, and a human has to say so. That is what
--      these columns are for.
--
-- Deliberately not a new `status` value. 008 separated the delivery lifecycle
-- from the fulfillment state precisely to stop two independent facts sharing
-- one column, and "closed by staff" is a third fact again. Marking these
-- 'delivered' would credit a rider with a delivery they never made and corrupt
-- both their stats and the day's counts; marking them 'cancelled' would claim
-- the customer never got their order.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Free text from a fixed set the UI offers, matching the reasoning in 009 for
-- failure_reason: the ways an order gets finished off-system change with
-- operations, and an enum makes each change a migration.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS closed_reason TEXT;

COMMENT ON COLUMN orders.closed_at IS
  'Set when staff close an order that was completed outside this system and outside Shopify. Never set by a rider or by sync.';

-- The dispatch queue reads "outstanding work" constantly, and that is now
-- three conditions rather than one. Without this it is a sequential scan of
-- every order the store has ever had.
CREATE INDEX IF NOT EXISTS idx_orders_outstanding
  ON orders (created_at DESC)
  WHERE status IN ('pending', 'assigned')
    AND shopify_fulfillment_id IS NULL
    AND closed_at IS NULL;

NOTIFY pgrst, 'reload schema';
