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
  -- On new assignment
  IF NEW.rider_id IS NOT NULL AND OLD.rider_id IS NULL THEN
    INSERT INTO assignment_history (order_id, rider_id, action, assigned_by)
    VALUES (NEW.id, NEW.rider_id, 'assigned', auth.uid());
    
    -- Update assigned_at timestamp
    NEW.assigned_at = now();
  
  -- On reassignment
  ELSIF NEW.rider_id IS NOT NULL AND OLD.rider_id IS NOT NULL AND NEW.rider_id != OLD.rider_id THEN
    INSERT INTO assignment_history (order_id, rider_id, action, assigned_by)
    VALUES (NEW.id, NEW.rider_id, 'reassigned', auth.uid());
    
    NEW.assigned_at = now();
  
  -- On unassignment
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

-- Add comments for documentation
COMMENT ON COLUMN riders.is_online IS 'Indicates if rider is currently online and available';
COMMENT ON COLUMN riders.current_location IS 'JSON object with lat/lng coordinates';
COMMENT ON COLUMN riders.last_location_update IS 'Timestamp of last location update';
COMMENT ON COLUMN orders.priority IS 'Order priority: urgent, high, normal, low';
COMMENT ON COLUMN orders.assigned_at IS 'Timestamp when order was assigned to a rider';
COMMENT ON TABLE assignment_history IS 'Audit trail of all order assignments and changes';
