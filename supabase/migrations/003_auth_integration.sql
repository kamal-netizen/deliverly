-- Update riders table to use auth.users ID
-- This allows linking riders table to Supabase Auth users

-- Remove existing UUID default (keep existing riders if any)
ALTER TABLE riders ALTER COLUMN id DROP DEFAULT;

-- Update RLS policies to work with auth.uid()
DROP POLICY IF EXISTS "Riders can view their assigned orders" ON orders;
DROP POLICY IF EXISTS "Riders can update their assigned orders" ON orders;
DROP POLICY IF EXISTS "Riders can view their delivery events" ON delivery_events;
DROP POLICY IF EXISTS "Riders can create delivery events" ON delivery_events;

-- New RLS policies using auth.uid()
CREATE POLICY "Riders can view their assigned orders"
  ON orders FOR SELECT
  USING (assigned_rider_id = auth.uid());

CREATE POLICY "Riders can update their assigned orders"
  ON orders FOR UPDATE
  USING (assigned_rider_id = auth.uid());

CREATE POLICY "Riders can view their delivery events"
  ON delivery_events FOR SELECT
  USING (rider_id = auth.uid());

CREATE POLICY "Riders can create delivery events"
  ON delivery_events FOR INSERT
  WITH CHECK (rider_id = auth.uid());

-- Add policy for riders to view their own profile
CREATE POLICY "Riders can view their own profile"
  ON riders FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Riders can update their own profile"
  ON riders FOR UPDATE
  USING (id = auth.uid());

-- Staff can view all riders (assuming staff role check in app)
CREATE POLICY "Staff can view all riders"
  ON riders FOR SELECT
  USING (true); -- Will be restricted by API authentication

-- Staff can manage riders
CREATE POLICY "Staff can insert riders"
  ON riders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update any rider"
  ON riders FOR UPDATE
  USING (true);

-- Create a function to handle rider profile on signup (optional - for future use)
CREATE OR REPLACE FUNCTION public.handle_new_rider()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used with a trigger on auth.users if needed
  -- For now, rider creation is handled by the API
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment: Riders table now uses Supabase Auth user IDs
-- When registering a rider via API, use the auth user ID as the rider ID
COMMENT ON TABLE riders IS 'Riders table linked to Supabase Auth via id = auth.uid()';
