import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireRider } from '@/lib/auth';

/**
 * Get assigned orders for authenticated rider
 * GET /api/rider/stops
 */
export async function GET(request: NextRequest) {
  const auth = await requireRider(request);
  if (!auth.ok) return auth.response;

  try {
    const riderId = auth.user.id;

    // Fetch assigned orders for this rider
    const { data: orders, error } = await getSupabaseAdmin()
      .from('orders')
      .select(`
        *,
        delivery_events (
          event_type,
          created_at,
          notes
        )
      `)
      .eq('assigned_rider_id', riderId)
      .in('status', ['assigned', 'delivered'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching rider stops:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
