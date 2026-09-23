import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * A rider whose last fix is older than this is shown as offline, whatever
 * is_online says.
 *
 * Apps are killed without getting to say goodbye - the OS reclaims memory, a
 * battery manager intervenes, the phone dies in a van. Trusting the flag alone
 * leaves ghosts sitting on the map at their last known position, which is worse
 * than showing nothing because it looks current.
 */
const STALE_AFTER_MINUTES = 10;

/**
 * Where riders currently are.
 * GET /api/riders/locations
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const admin = getSupabaseAdmin();

    const { data: riders, error } = await admin
      .from('riders')
      .select('id, name, phone, active, is_online, current_location, last_location_update')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // One query for the whole workload rather than one per rider.
    const { data: assignments, error: assignmentError } = await admin
      .from('orders')
      .select('assigned_rider_id')
      .eq('status', 'assigned')
      // Same rule as the dispatch queue and the rider's own stop list: an
      // order somebody else fulfilled is not this rider's workload, even
      // though its status still says assigned.
      .is('shopify_fulfillment_id', null)
      .is('closed_at', null)
      .not('assigned_rider_id', 'is', null);

    if (assignmentError) throw assignmentError;

    const workload = new Map<string, number>();
    for (const row of assignments ?? []) {
      const id = row.assigned_rider_id as string;
      workload.set(id, (workload.get(id) ?? 0) + 1);
    }

    const now = Date.now();

    const result = (riders ?? []).map((rider) => {
      const location = rider.current_location as
        | { latitude?: number; longitude?: number }
        | null;

      const updatedAt = rider.last_location_update
        ? new Date(rider.last_location_update).getTime()
        : null;

      const ageMinutes =
        updatedAt === null ? null : Math.round((now - updatedAt) / 60000);

      return {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        lastUpdate: rider.last_location_update,
        ageMinutes,
        // Both conditions, deliberately. See STALE_AFTER_MINUTES.
        live:
          rider.is_online === true &&
          ageMinutes !== null &&
          ageMinutes <= STALE_AFTER_MINUTES,
        assignedOrders: workload.get(rider.id) ?? 0,
      };
    });

    return NextResponse.json(
      {
        riders: result,
        staleAfterMinutes: STALE_AFTER_MINUTES,
        // Riders who have never reported at all - typically the rider app was
        // never installed, or a shift was never started.
        neverReported: result.filter((r) => r.lastUpdate === null).length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching rider locations:', error);
    return NextResponse.json({ error: 'Could not load rider locations' }, { status: 500 });
  }
}
