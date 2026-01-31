-- Add last_sync_at column to track webhook processing
ALTER TABLE shopify_config
ADD COLUMN last_sync_at TIMESTAMPTZ;

-- Set initial value to installed_at for existing records
UPDATE shopify_config
SET last_sync_at = installed_at
WHERE last_sync_at IS NULL;
