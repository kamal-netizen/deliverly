-- 011: Stop webhooks advancing the sync cursor
--
-- `last_sync_at` does two unrelated jobs, and one of them was silently
-- destroying the other.
--
--   1. It is the incremental sync cursor. /api/sync/orders sends it to Shopify
--      as `updated_at_min`, meaning "tell me everything that changed after
--      this".
--   2. It is what the settings page shows as "last synced", to prove the
--      integration is alive.
--
-- Every webhook handler called markSynced(), for the second reason. But that
-- wrote the first. So an orders/create webhook - which reconciles exactly one
-- order and knows nothing about any other - pushed the cursor to now(), and
-- the next real sync asked Shopify only for changes since that webhook.
--
-- Anything fulfilled before it fell outside the window and was never asked for
-- again. Orders kept arriving, because that is the webhook path, so the
-- integration looked healthy while quietly never learning that any existing
-- order had been fulfilled. Orders delivered by another courier sat in the
-- dispatch queue for weeks.
--
-- The two facts are now two columns. last_sync_at means "everything up to here
-- has been reconciled" and only a completed sync may write it. last_webhook_at
-- means "we heard from Shopify at this time" and is for display only - it must
-- never be used as a cursor.
--
-- This is the same mistake as 008, in a different table: two independent facts
-- sharing one column, where writing one corrupts the other.

ALTER TABLE shopify_config
  ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ;

COMMENT ON COLUMN shopify_config.last_sync_at IS
  'Incremental sync cursor, sent to Shopify as updated_at_min. Only a completed sync may write this. Webhooks must not: they reconcile one order and would skip everything changed earlier.';

COMMENT ON COLUMN shopify_config.last_webhook_at IS
  'Last time any Shopify webhook was received. Display only - never a cursor.';

-- Seed liveness from the value webhooks have been writing, so the settings
-- page does not read as though Shopify went quiet the moment this shipped.
UPDATE shopify_config
SET last_webhook_at = last_sync_at
WHERE last_webhook_at IS NULL;

-- Rewind the cursor to the install.
--
-- It currently points at the most recent webhook rather than at genuinely
-- reconciled work, so everything fulfilled between install and now was never
-- fetched. The next sync has to go back and ask for all of it.
UPDATE shopify_config
SET last_sync_at = installed_at
WHERE installed_at IS NOT NULL;

NOTIFY pgrst, 'reload schema';
