# Database Migrations

This directory contains SQL migrations for the Deliverly database schema.

## How to Apply Migrations to Supabase

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New Query**
4. Copy the content from the migration file you want to apply
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Migration Files

### 001_initial_schema.sql
- Creates core tables: `orders`, `riders`, `assignments`
- Sets up basic RLS policies
- Initial table structure

### 002_storage_setup.sql
- Configures Supabase Storage buckets
- Sets up delivery proof storage
- Adds storage policies

### 003_auth_integration.sql
- Integrates authentication
- Sets up user roles
- Adds auth-based RLS policies

### 004_add_last_sync.sql
- Adds `last_sync_at` column to orders
- Tracks Shopify synchronization

### 005_enhanced_features.sql ⭐ **NEW**
- Adds rider tracking (`is_online`, `current_location`)
- Adds order priority system
- Creates `assignment_history` table for audit trail
- Adds automatic triggers for:
  - Rider statistics updates
  - Assignment history tracking
- Performance indexes
- Proper constraints and validations

## New Features from 005_enhanced_features.sql

### Rider Enhancements
- `is_online` - Track rider availability
- `current_location` - Store lat/lng coordinates
- `last_location_update` - Track when location was last updated
- `total_deliveries` - Auto-increment on delivery completion
- `rating` - Store rider ratings (0.00 to 5.00)

### Order Enhancements
- `priority` - Set order urgency (urgent/high/normal/low)
- `assigned_at` - Automatically set when assigned
- `estimated_delivery_time` - For customer ETA
- `delivery_notes` - Special delivery instructions

### Assignment History
Audit trail showing:
- Who assigned what order to which rider
- When assignments were made
- Reassignment tracking
- Unassignment tracking

### Automatic Triggers
1. **Rider Stats Update** - Increments `total_deliveries` when order status changes to "delivered"
2. **Assignment History** - Automatically logs all assignment changes

## Applying the Latest Migration

To add all new features to your Supabase database:

```sql
-- Copy and run this in Supabase SQL Editor
-- File: supabase/migrations/005_enhanced_features.sql
```

## Checking Migration Status

To verify migrations were applied:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'riders' 
  AND column_name IN ('is_online', 'current_location', 'rating');

-- Check if assignment_history table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'assignment_history'
);

-- Check if triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_update_rider_stats', 'trigger_track_assignment_history');
```

## Rolling Back (if needed)

```sql
-- Drop new columns
ALTER TABLE riders DROP COLUMN IF EXISTS is_online;
ALTER TABLE riders DROP COLUMN IF EXISTS current_location;
ALTER TABLE riders DROP COLUMN IF EXISTS last_location_update;
ALTER TABLE riders DROP COLUMN IF EXISTS total_deliveries;
ALTER TABLE riders DROP COLUMN IF EXISTS rating;

ALTER TABLE orders DROP COLUMN IF EXISTS assigned_at;
ALTER TABLE orders DROP COLUMN IF EXISTS priority;
ALTER TABLE orders DROP COLUMN IF EXISTS estimated_delivery_time;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_notes;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_rider_stats ON orders;
DROP TRIGGER IF EXISTS trigger_track_assignment_history ON orders;

-- Drop functions
DROP FUNCTION IF EXISTS update_rider_stats();
DROP FUNCTION IF EXISTS track_assignment_history();

-- Drop table
DROP TABLE IF EXISTS assignment_history;
```

## Need Help?

If you encounter any errors:
1. Check Supabase logs in the Dashboard
2. Verify you have proper permissions
3. Ensure previous migrations were applied
4. Contact support if issues persist
