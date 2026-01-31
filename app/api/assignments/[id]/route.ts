import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withCors, handleOptions } from '@/lib/cors';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

/**
 * Unassign rider from order
 * DELETE /api/assignments/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: orderId } = params;

    // Verify order exists
    const { data: order, error: orderError } = await supabaseAdmin
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

    if (order.status === 'delivered' || order.status === 'fulfilled') {
      return NextResponse.json(
        { error: 'Cannot unassign delivered/fulfilled order' },
        { status: 400 }
      );
    }

    // Create unassignment event
    await supabaseAdmin.from('delivery_events').insert({
      order_id: orderId,
      rider_id: order.assigned_rider_id,
      event_type: 'unassigned'
    });

    // Update order - remove rider and set status back to pending
    await supabaseAdmin
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
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error unassigning rider:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
