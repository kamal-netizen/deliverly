import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireRider } from '@/lib/auth';
import { RIDER_STOPS_HISTORY_HOURS } from '@/lib/delivery';

/**
 * The rider's current work.
 * GET /api/rider/stops
 *
 * Everything still assigned, plus recently completed work so the app can show
 * what has been done today without a second request.
 *
 * The completed half is time-bounded. Without that this returned every order
 * the rider had ever been assigned, so the app re-downloaded an entire career's
 * deliveries on every poll - over mobile data, on a phone, in a van.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRider(request);
  if (!auth.ok) return auth.response;

  try {
    const riderId = auth.user.id;
    const admin = getSupabaseAdmin();

    const since = new Date();
    since.setHours(since.getHours() - RIDER_STOPS_HISTORY_HOURS);

    const select = `
        *,
        delivery_events (
          event_type,
          created_at,
          notes
        )
      `;

    // Two queries rather than one `or` filter: PostgREST cannot express
    // "assigned regardless of age, OR delivered within the window" in a single
    // readable filter, and an unbounded read is what we are fixing.
    const [active, recent] = await Promise.all([
      // Still assigned, and still actually ours to deliver.
      //
      // `status` alone was not enough. An order fulfilled in Shopify by someone
      // else - another courier, a counter collection - keeps status 'assigned'
      // forever, because nothing in this system ever happened to it. The rider
      // kept seeing the stop on their phone and would have driven to a door
      // where the parcel had already been delivered.
      //
      // Deliberately only on this query. The `recent` half below lists work the
      // rider has completed, and our own fulfilment sets shopify_fulfillment_id
      // too - filtering there would empty their done-today list.
      admin
        .from('orders')
        .select(select)
        .eq('assigned_rider_id', riderId)
        .eq('status', 'assigned')
        .is('shopify_fulfillment_id', null)
        .is('closed_at', null)
        .order('created_at', { ascending: false }),

      admin
        .from('orders')
        .select(select)
        .eq('assigned_rider_id', riderId)
        .eq('status', 'delivered')
        .gte('delivered_at', since.toISOString())
        .order('delivered_at', { ascending: false }),
    ]);

    if (active.error) throw active.error;
    if (recent.error) throw recent.error;

    // Shape unchanged: { orders: [...] }, assigned first, then recent
    // deliveries - the order a rider works through them.
    const orders = [...(active.data ?? []), ...(recent.data ?? [])];

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rider stops:', error);
    return NextResponse.json({ error: 'Could not load your stops' }, { status: 500 });
  }
}
