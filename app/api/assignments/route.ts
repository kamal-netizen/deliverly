import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Assign order to rider
 * POST /api/assignments
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { orderId, riderId } = body;

    if (!orderId || !riderId) {
      console.error('Missing required fields:', { orderId, riderId, body });
      return NextResponse.json(
        { error: 'orderId and riderId required' },
        { status: 400 }
      );
    }

    // Verify order exists and is not already delivered
    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from('orders')
      .select('id, status, assigned_rider_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 'fulfilled' is no longer a status (migration 008). 'cancelled' is the
    // value that actually needs guarding - the old check let a cancelled order
    // be assigned to a rider.
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot assign a ${order.status} order` },
        { status: 400 }
      );
    }

    // Verify rider exists
    const { data: rider, error: riderError } = await getSupabaseAdmin()
      .from('riders')
      .select('id, name, active')
      .eq('id', riderId)
      .single();

    if (riderError || !rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    if (!rider.active) {
      return NextResponse.json({ error: 'Rider is inactive' }, { status: 400 });
    }

    // Determine event type
    const eventType = order.assigned_rider_id
      ? 'reassigned'
      : 'assigned';

    // Create assignment event
    await getSupabaseAdmin().from('delivery_events').insert({
      id: crypto.randomUUID(),
      order_id: orderId,
      rider_id: riderId,
      event_type: eventType
    });

    // Update order
    await getSupabaseAdmin()
      .from('orders')
      .update({
        assigned_rider_id: riderId,
        status: 'assigned'
      })
      .eq('id', orderId);

    const response = NextResponse.json({
      success: true,
      assignment: {
        orderId,
        riderId,
        riderName: rider.name,
        eventType
      }
    }, { status: 200 });
    return response;

  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
