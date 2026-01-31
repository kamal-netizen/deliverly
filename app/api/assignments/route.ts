import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withCors, handleOptions } from '@/lib/cors';

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

/**
 * Assign order to rider
 * POST /api/assignments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, riderId } = body;

    if (!orderId || !riderId) {
      return NextResponse.json(
        { error: 'orderId and riderId required' },
        { status: 400 }
      );
    }

    // Verify order exists and is not already delivered
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, assigned_rider_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'delivered' || order.status === 'fulfilled') {
      return NextResponse.json(
        { error: 'Cannot assign delivered order' },
        { status: 400 }
      );
    }

    // Verify rider exists
    const { data: rider, error: riderError } = await supabaseAdmin
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
    await supabaseAdmin.from('delivery_events').insert({
      order_id: orderId,
      rider_id: riderId,
      event_type: eventType
    });

    // Update order
    await supabaseAdmin
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
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
