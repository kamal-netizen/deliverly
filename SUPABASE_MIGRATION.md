# 🗄️ Supabase Database Migration Guide

## Quick Start: Apply All Enhanced Features

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **+ New Query**

### Step 2: Copy & Paste This SQL

```sql
-- Enhanced Features Migration
-- Add new columns for improved functionality

-- Add rider tracking and status fields
ALTER TABLE riders ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS current_location JSONB;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;

-- Add order assignment and priority tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' 
  CHECK (priority IN ('urgent', 'high', 'normal', 'low'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Add assignment history table for audit trail
CREATE TABLE IF NOT EXISTS assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('assigned', 'reassigned', 'unassigned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_riders_is_online ON riders(is_online);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_at ON orders(assigned_at);
CREATE INDEX IF NOT EXISTS idx_assignment_history_order ON assignment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_rider ON assignment_history(rider_id);

-- Add function to update rider stats on delivery completion
CREATE OR REPLACE FUNCTION update_rider_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.rider_id IS NOT NULL THEN
    UPDATE riders 
    SET total_deliveries = total_deliveries + 1
    WHERE id = NEW.rider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rider stats update
DROP TRIGGER IF EXISTS trigger_update_rider_stats ON orders;
CREATE TRIGGER trigger_update_rider_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_rider_stats();

-- Add function to track assignment history
CREATE OR REPLACE FUNCTION track_assignment_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rider_id IS NOT NULL AND OLD.rider_id IS NULL THEN
    INSERT INTO assignment_history (order_id, rider_id, action, assigned_by)
    VALUES (NEW.id, NEW.rider_id, 'assigned', auth.uid());
    NEW.assigned_at = now();
  ELSIF NEW.rider_id IS NOT NULL AND OLD.rider_id IS NOT NULL AND NEW.rider_id != OLD.rider_id THEN
    INSERT INTO assignment_history (order_id, rider_id, action, assigned_by)
    VALUES (NEW.id, NEW.rider_id, 'reassigned', auth.uid());
    NEW.assigned_at = now();
  ELSIF NEW.rider_id IS NULL AND OLD.rider_id IS NOT NULL THEN
    INSERT INTO assignment_history (order_id, rider_id, action, assigned_by)
    VALUES (NEW.id, OLD.rider_id, 'unassigned', auth.uid());
    NEW.assigned_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assignment history tracking
DROP TRIGGER IF EXISTS trigger_track_assignment_history ON orders;
CREATE TRIGGER trigger_track_assignment_history
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.rider_id IS DISTINCT FROM NEW.rider_id)
  EXECUTE FUNCTION track_assignment_history();

-- Add RLS policies for assignment_history
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignment history"
  ON assignment_history FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Step 3: Click "Run" ▶️

### Step 4: Verify Installation

Run this to check everything worked:

```sql
-- Check new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'riders' 
  AND column_name IN ('is_online', 'current_location', 'rating');

-- Check new table
SELECT * FROM assignment_history LIMIT 1;

-- Check triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name LIKE '%assignment%' OR trigger_name LIKE '%rider_stats%';
```

You should see:
- ✅ 3 new columns in riders table
- ✅ assignment_history table exists
- ✅ 2 triggers active

---

## 📊 What You Just Added

### New Rider Tracking
- **is_online**: See which riders are available right now
- **current_location**: GPS coordinates for live map
- **last_location_update**: When location was last updated
- **total_deliveries**: Auto-increments with each delivery
- **rating**: Store rider ratings (0.00-5.00)

### Order Priority System
- **priority**: urgent/high/normal/low
- **assigned_at**: Timestamp when assigned
- **estimated_delivery_time**: For customer ETAs
- **delivery_notes**: Special instructions

### Assignment Audit Trail
- **assignment_history** table logs:
  - Every assignment
  - Every reassignment
  - Every unassignment
  - Who made the change
  - When it happened

### Automatic Features
1. **Auto-increment deliveries**: When order status → delivered
2. **Auto-log assignments**: Every rider assignment tracked
3. **Performance indexes**: Faster queries for busy apps

---

## 🔧 Optional: Update Existing Data

If you have existing orders/riders, set defaults:

```sql
-- Set all existing riders to offline
UPDATE riders SET is_online = false WHERE is_online IS NULL;

-- Set all existing orders to normal priority
UPDATE orders SET priority = 'normal' WHERE priority IS NULL;

-- Count existing deliveries for each rider
UPDATE riders r
SET total_deliveries = (
  SELECT COUNT(*) 
  FROM orders o 
  WHERE o.assigned_rider_id = r.id 
    AND o.status = 'delivered'
);
```

---

## 🚀 Next Steps

### 1. Test in Development
```bash
npm run dev
```

### 2. Use New Fields in Dispatch Board
The app now supports:
- Filtering by priority
- Showing rider stats
- Assignment history view

### 3. Enable Location Tracking
Update rider location:
```typescript
// In your rider mobile app
await apiClient.updateRider(riderId, {
  current_location: { lat: 40.7128, lng: -74.0060 },
  last_location_update: new Date().toISOString(),
  is_online: true
})
```

---

## 📁 Full Migration File Location

`supabase/migrations/005_enhanced_features.sql`

All detailed documentation: `supabase/migrations/README.md`

---

## ✅ Status Check

After applying migration, your database will have:

**Riders Table:**
- ✅ 10 columns (was 6)
- ✅ Location tracking
- ✅ Stats tracking

**Orders Table:**
- ✅ 18 columns (was 14)
- ✅ Priority system
- ✅ Assignment timestamps

**New Tables:**
- ✅ assignment_history (audit log)

**Triggers:**
- ✅ Auto-update rider stats
- ✅ Auto-track assignments

**Performance:**
- ✅ 5 new indexes
- ✅ Optimized queries

---

## ⚠️ Troubleshooting

**Error: "column already exists"**
- Safe to ignore - means migration was already applied

**Error: "relation does not exist"**
- Run earlier migrations first (001-004)

**Error: "permission denied"**
- Ensure you're logged into correct Supabase project

Need help? Check full docs in `supabase/migrations/README.md`
