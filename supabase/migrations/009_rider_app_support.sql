-- 009: Schema the rider app needs
--
-- Three things the current schema cannot express:
--
--   * a delivery submitted twice. Riders lose signal in basements and car
--     parks, so the app queues submissions and retries them. Without a client
--     supplied id, a retry is indistinguishable from a second delivery.
--   * a delivery that failed. `failed` has existed in both order_status and
--     event_type since 001 and nothing has ever written it, so a rider facing
--     nobody home has no action but to claim success or do nothing.
--   * where a rider is. 005 added is_online, current_location and
--     last_location_update to riders; nothing reads or writes them.

-- ---------------------------------------------------------------------------
-- A. Idempotent delivery submission
-- ---------------------------------------------------------------------------

-- Generated on the device before the first attempt and reused on every retry.
-- Nullable so existing rows and any caller that does not send one still work.
ALTER TABLE delivery_events
  ADD COLUMN IF NOT EXISTS client_event_id TEXT;

-- Scoped per rider rather than globally: two devices cannot collide, and a
-- malicious client cannot suppress another rider's event by guessing its id.
CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_events_client_id
  ON delivery_events (rider_id, client_event_id)
  WHERE client_event_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- B. Failed deliveries
-- ---------------------------------------------------------------------------

-- Free text from a fixed set the app offers, rather than an enum: the reasons
-- a parcel comes back change with operations, and an enum makes that a
-- migration every time.
ALTER TABLE delivery_events
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- How many times delivery has been attempted and not completed. Dispatch needs
-- this to decide between reassigning and returning the parcel to the store.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER NOT NULL DEFAULT 0;

-- Dispatch's working queue: failed, still assigned to someone, needing a
-- decision. Without an index this is a sequential scan over every order.
CREATE INDEX IF NOT EXISTS idx_orders_failed
  ON orders (failed_at DESC)
  WHERE status = 'failed';

-- ---------------------------------------------------------------------------
-- C. Rider location
-- ---------------------------------------------------------------------------

-- Riders already carries is_online, current_location and last_location_update.
-- What is missing is a way to find who is currently active without scanning
-- every rider.
CREATE INDEX IF NOT EXISTS idx_riders_active_location
  ON riders (last_location_update DESC)
  WHERE is_online = true;

-- A rider who closed the app or lost signal is not online, whatever the flag
-- says. The dashboard treats a stale timestamp as offline rather than trusting
-- is_online, and this makes that query cheap.
COMMENT ON COLUMN riders.last_location_update IS
  'Treat a rider as offline when this is older than a few minutes, regardless of is_online: apps are killed without getting to say goodbye.';

-- ---------------------------------------------------------------------------
-- D. Rider-visible policies for the new columns
-- ---------------------------------------------------------------------------
-- The API uses the service role, so these matter only if a rider ever talks to
-- PostgREST directly. Kept consistent with 007 so that stays safe by default.

NOTIFY pgrst, 'reload schema';
