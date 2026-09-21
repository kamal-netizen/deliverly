import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';
import { merchantTimezone } from '@/lib/env';

/**
 * Offset between UTC and a timezone at a given instant, in milliseconds.
 */
function timezoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second')
  );

  return asUtc - at.getTime();
}

/**
 * The instant today began in the merchant's timezone.
 *
 * `new Date().setHours(0,0,0,0)` used the server's clock, which is UTC on most
 * hosts. For a Gulf merchant that put every order between 00:00 and 04:00 local
 * into the previous day's count.
 */
function startOfMerchantDay(timeZone: string): string {
  const now = new Date();
  const offset = timezoneOffsetMs(now, timeZone);

  const local = new Date(now.getTime() + offset);
  const localMidnight = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate()
  );

  return new Date(localMidnight - offset).toISOString();
}

/**
 * Dashboard statistics
 * GET /api/stats
 *
 * Response is flat. It used to be wrapped in a `stats` key with riders under
 * `riders.active`, while the client read `today` and `activeRiders` at the top
 * level - so every tile on the dashboard rendered 0.
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const admin = getSupabaseAdmin();
    const since = startOfMerchantDay(merchantTimezone());

    // Counted in the database. Selecting every row and counting in JS silently
    // under-reported past PostgREST's 1000-row ceiling.
    const todayCount = (status?: string) => {
      let q = admin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since);

      if (status) q = q.eq('status', status);
      return q;
    };

    const [
      total,
      pending,
      assigned,
      delivered,
      cancelled,
      activeRiders,
      totalOrders,
      totalDeliveries,
      awaitingFulfillment,
    ] = await Promise.all([
      todayCount(),
      todayCount('pending'),
      todayCount('assigned'),
      todayCount('delivered'),
      todayCount('cancelled'),
      admin.from('riders').select('*', { count: 'exact', head: true }).eq('active', true),
      admin.from('orders').select('*', { count: 'exact', head: true }),
      admin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered'),
      // Delivered, but Shopify has not been told. These are exactly the orders
      // the old delivered/fulfilled split lost track of.
      admin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .is('shopify_fulfillment_id', null),
    ]);

    const firstError = [
      total,
      pending,
      assigned,
      delivered,
      cancelled,
      activeRiders,
      totalOrders,
      totalDeliveries,
      awaitingFulfillment,
    ].find((r) => r.error)?.error;

    if (firstError) throw firstError;

    return NextResponse.json(
      {
        today: {
          total: total.count ?? 0,
          pending: pending.count ?? 0,
          assigned: assigned.count ?? 0,
          delivered: delivered.count ?? 0,
          cancelled: cancelled.count ?? 0,
        },
        activeRiders: activeRiders.count ?? 0,
        allTime: {
          totalOrders: totalOrders.count ?? 0,
          totalDeliveries: totalDeliveries.count ?? 0,
        },
        awaitingFulfillment: awaitingFulfillment.count ?? 0,
        timezone: merchantTimezone(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Could not load statistics' }, { status: 500 });
  }
}
