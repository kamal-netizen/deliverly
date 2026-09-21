import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Unassign rider from order
 * DELETE /api/assignments/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { id: orderId } = await params;

    // Verify order exists
    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from('orders')
      .select('id, assigned_rider_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.assigned_rider_id) {
      return NextResponse.json(
        { error: 'Order has no assigned rider' },
        { status: 400 }
      );
    }

    // Unassigning resets the order to 'pending'. Doing that to a cancelled
    // order resurrected it, so cancelled is guarded here too.
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot unassign a ${order.status} order` },
        { status: 400 }
      );
    }

    // Create unassignment event
    await getSupabaseAdmin().from('delivery_events').insert({
      id: crypto.randomUUID(),
      order_id: orderId,
      rider_id: order.assigned_rider_id,
      event_type: 'unassigned'
    });

    // Update order - remove rider and set status back to pending
    await getSupabaseAdmin()
      .from('orders')
      .update({
        assigned_rider_id: null,
        status: 'pending'
      })
      .eq('id', orderId);

    const response = NextResponse.json({
      success: true,
      message: 'Rider unassigned successfully'
    }, { status: 200 });
    return response;

  } catch (error: any) {
    console.error('Error unassigning rider:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
