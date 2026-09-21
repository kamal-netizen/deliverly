-- 007: Security lockdown
--
-- Closes the gap between "the API is authenticated" and "the database is
-- protected". Every table here is reachable directly over PostgREST with the
-- anon key, which ships to every browser, so API-side guards alone are not a
-- boundary.
--
-- What this fixes:
--   * shopify_config and webhook_log never had RLS enabled at all. 001 assumed
--     "accessed via service role only, no policies needed" - but with RLS off,
--     no policies means unrestricted, not denied. The anon key could read the
--     plaintext Shopify Admin API token and every customer's order payload.
--   * riders carried three USING (true) policies with no TO clause, so anon
--     could read all rider PII and rewrite any rider row.
--   * The storage policy "Service role full access" had no TO clause, so it
--     granted anon full read/delete on delivery-proofs, defeating the private
--     bucket.
--
-- Re-runnable, unlike 001-004.
--
-- NOTE: the delivered/fulfilled status lifecycle change lives in 008, because
-- it has to land together with the application code that writes those values.

-- ---------------------------------------------------------------------------
-- A. Tables that should never be client-reachable
-- ---------------------------------------------------------------------------

ALTER TABLE shopify_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_log    ENABLE ROW LEVEL SECURITY;

-- RLS with zero policies denies everything. service_role has BYPASSRLS, so the
-- API routes are unaffected. The REVOKE is a second layer: it means a policy
-- added carelessly later still cannot expose these tables.
REVOKE ALL ON shopify_config FROM anon, authenticated;
REVOKE ALL ON webhook_log    FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- B. Lock anon out of the remaining tables entirely
-- ---------------------------------------------------------------------------
-- The anon key is used only to sign in and to verify session cookies. Nothing
-- in the app queries a table with it.

REVOKE ALL ON riders             FROM anon;
REVOKE ALL ON orders             FROM anon;
REVOKE ALL ON delivery_events    FROM anon;
REVOKE ALL ON assignment_history FROM anon;

-- Tables created later by this role start closed rather than open. Default
-- privileges are per-creating-role, so this is a safety net, not a guarantee.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- ---------------------------------------------------------------------------
-- C. Replace the wide-open rider policies
-- ---------------------------------------------------------------------------
-- 003 created these with USING (true) and the comment "will be restricted by
-- API authentication". That restriction was never written, and PostgREST is
-- reachable without going through the API at all.

DROP POLICY IF EXISTS "Staff can view all riders"  ON riders;
DROP POLICY IF EXISTS "Staff can insert riders"    ON riders;
DROP POLICY IF EXISTS "Staff can update any rider" ON riders;

-- Read the role from app_metadata, which only the service role can write.
-- user_metadata is user-writable with the anon key, so a rider could otherwise
-- promote themselves to staff.
DROP POLICY IF EXISTS riders_staff_all ON riders;
CREATE POLICY riders_staff_all ON riders
  FOR ALL
  TO authenticated
  USING      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'staff')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'staff');

-- ---------------------------------------------------------------------------
-- D. Scope the 003 policies to authenticated
-- ---------------------------------------------------------------------------
-- Without a TO clause a policy defaults to PUBLIC, which includes anon. These
-- all test auth.uid(), which is NULL for anon, so they were not exploitable -
-- but they should say what they mean.

DROP POLICY IF EXISTS "Riders can view their assigned orders"   ON orders;
CREATE POLICY "Riders can view their assigned orders" ON orders
  FOR SELECT TO authenticated
  USING (assigned_rider_id = auth.uid());

DROP POLICY IF EXISTS "Riders can update their assigned orders" ON orders;
CREATE POLICY "Riders can update their assigned orders" ON orders
  FOR UPDATE TO authenticated
  USING (assigned_rider_id = auth.uid())
  WITH CHECK (assigned_rider_id = auth.uid());

DROP POLICY IF EXISTS "Riders can view their delivery events"   ON delivery_events;
CREATE POLICY "Riders can view their delivery events" ON delivery_events
  FOR SELECT TO authenticated
  USING (rider_id = auth.uid());

DROP POLICY IF EXISTS "Riders can create delivery events"       ON delivery_events;
CREATE POLICY "Riders can create delivery events" ON delivery_events
  FOR INSERT TO authenticated
  WITH CHECK (rider_id = auth.uid());

DROP POLICY IF EXISTS "Riders can view their own profile"   ON riders;
CREATE POLICY "Riders can view their own profile" ON riders
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Riders can update their own profile" ON riders;
CREATE POLICY "Riders can update their own profile" ON riders
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Every authenticated rider could read the full dispatch audit trail for every
-- order and every other rider.
DROP POLICY IF EXISTS "Users can view assignment history" ON assignment_history;
CREATE POLICY assignment_history_own ON assignment_history
  FOR SELECT TO authenticated
  USING (
    rider_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  );

-- ---------------------------------------------------------------------------
-- E. Storage: delivery proof photos
-- ---------------------------------------------------------------------------
-- "Service role full access" had no TO clause, so it resolved to PUBLIC and
-- handed anon read/write/delete on every proof photo. Because permissive
-- policies OR together, it also nullified the authenticated checks on the other
-- two. service_role bypasses RLS unconditionally, so the policy bought nothing.
--
-- The bucket is private and every signed URL is minted server-side, so the
-- correct policy set is: none.

DROP POLICY IF EXISTS "Service role full access"              ON storage.objects;
DROP POLICY IF EXISTS "Riders can upload proof images"        ON storage.objects;
DROP POLICY IF EXISTS "Riders can view their uploaded images" ON storage.objects;

UPDATE storage.buckets SET public = false WHERE id = 'delivery-proofs';

-- ---------------------------------------------------------------------------
-- F. Make shopify_config a real singleton
-- ---------------------------------------------------------------------------
-- The code treats it as one row (.single(), and updates that match every row),
-- but nothing enforced it. A second install made .single() throw across eight
-- call sites and made "is Shopify connected?" answer no while connected.

CREATE UNIQUE INDEX IF NOT EXISTS shopify_config_singleton
  ON shopify_config ((1));

-- ---------------------------------------------------------------------------
-- G. Indexes
-- ---------------------------------------------------------------------------

-- Every orders listing sorts by created_at desc; nothing indexed it.
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON orders (status, created_at DESC);

-- Makes double-fulfillment a database error rather than a silent duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_shopify_fulfillment
  ON orders (shopify_fulfillment_id)
  WHERE shopify_fulfillment_id IS NOT NULL;

-- Redundant: both columns already carry UNIQUE constraints, which create their
-- own indexes. These only cost write throughput.
DROP INDEX IF EXISTS idx_orders_tracking_code;
DROP INDEX IF EXISTS idx_orders_shopify_order_id;

-- ---------------------------------------------------------------------------
-- H. riders.id must be a real auth user
-- ---------------------------------------------------------------------------
-- 003 dropped the default on riders.id without adding a foreign key, and the
-- old POST /api/riders filled it with crypto.randomUUID(). Those riders can
-- never sign in, and their id can never match a JWT subject, so they can never
-- appear in /api/rider/stops either.
--
-- orders.assigned_rider_id and delivery_events.rider_id have no ON DELETE
-- clause, so they default to NO ACTION and would block the cleanup. Detach
-- them first.

UPDATE orders o
   SET assigned_rider_id = NULL
 WHERE o.assigned_rider_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = o.assigned_rider_id);

UPDATE delivery_events e
   SET rider_id = NULL
 WHERE e.rider_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = e.rider_id);

DELETE FROM riders r
 WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'riders_id_fkey'
  ) THEN
    ALTER TABLE riders
      ADD CONSTRAINT riders_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- I. Let the assignment-history trigger write under RLS
-- ---------------------------------------------------------------------------
-- track_assignment_history() inserts into assignment_history, which has RLS on
-- and no INSERT policy. Under service_role that is fine today, but any
-- non-service-role update of assigned_rider_id would abort the whole statement.

ALTER FUNCTION public.track_assignment_history() SECURITY DEFINER;
ALTER FUNCTION public.update_rider_stats()       SECURITY DEFINER;

-- A SECURITY DEFINER function without a pinned search_path can be hijacked by
-- a caller-controlled schema shadowing the objects it references.
ALTER FUNCTION public.track_assignment_history() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_rider_stats()       SET search_path = public, pg_temp;

-- PostgREST caches the schema, including foreign keys, and will not notice
-- anything above until told. Without this, nested selects such as
-- orders -> delivery_events fail with PGRST200 "Could not find a relationship",
-- which looks like a missing foreign key rather than a stale cache.
NOTIFY pgrst, 'reload schema';
