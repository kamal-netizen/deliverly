import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireRider } from '@/lib/auth';

/**
 * Report the rider's current position.
 * POST /api/rider/location  { latitude, longitude, isOnline? }
 *
 * Called periodically while a rider is on shift. Deliberately cheap: one row
 * update, no event history. A location trail would be a far larger design
 * decision - storage, retention, and what a business is entitled to keep about
 * an employee's movements - and dispatch only needs the current position.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRider(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);

    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: 'Valid latitude required' }, { status: 400 });
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Valid longitude required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { error } = await getSupabaseAdmin()
      .from('riders')
      .update({
        current_location: { latitude, longitude },
        last_location_update: now,
        is_online: body?.isOnline === false ? false : true,
      })
      .eq('id', auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, recordedAt: now }, { status: 200 });
  } catch (error: any) {
    console.error('Rider location update error:', error);
    return NextResponse.json({ error: 'Could not record location' }, { status: 500 });
  }
}
