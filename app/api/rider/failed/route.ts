import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireRider } from '@/lib/auth';
import { FAILURE_REASONS, isFailureReason } from '@/lib/delivery';

/**
 * Record a delivery that could not be completed.
 * POST /api/rider/failed   (multipart/form-data)
 *
 *   orderId        required
 *   reason         required, one of FAILURE_REASONS
 *   clientEventId  strongly recommended - makes the submission safe to retry
 *   image, latitude, longitude, notes
 *
 * Until now `failed` existed in both order_status and event_type and nothing
 * ever wrote it, so a rider facing nobody home could either claim a delivery
 * that did not happen or do nothing at all. The order returns to dispatch with
 * the attempt recorded, rather than sitting assigned to a rider who has moved
 * on.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRider(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  const riderId = auth.user.id;

  try {
    const formData = await request.formData();

    const orderId = formData.get('orderId') as string;
    const reason = formData.get('reason') as string;
    const clientEventId = (formData.get('clientEventId') as string) || null;
    const image = formData.get('image');
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const notes = formData.get('notes') as string;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    if (!isFailureReason(reason)) {
      return NextResponse.json(
        { error: `reason must be one of: ${FAILURE_REASONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (clientEventId) {
      const { data: existing } = await admin
        .from('delivery_events')
        .select('id, order_id')
        .eq('rider_id', riderId)
        .eq('client_event_id', clientEventId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { success: true, alreadyRecorded: true, order: { id: existing.order_id, status: 'failed' } },
          { status: 200 }
        );
      }
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, assigned_rider_id, status, order_number, delivery_attempts')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assigned_rider_id !== riderId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ error: 'Order already delivered' }, { status: 400 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order was cancelled' }, { status: 400 });
    }

    let proofImagePath: string | null = null;

    // A photo of the closed door or wrong address is worth as much here as a
    // proof of delivery, and is often what settles a dispute later.
    if (image instanceof File && image.size > 0) {
      const extension = image.name.split('.').pop() || 'jpg';
      const filePath = `proofs/${orderId}-failed-${Date.now()}.${extension}`;

      const { error: uploadError } = await admin.storage
        .from('delivery-proofs')
        .upload(filePath, image, { contentType: image.type, upsert: false });

      if (uploadError) {
        console.error('Failure image upload failed:', uploadError);
      } else {
        proofImagePath = filePath;
      }
    }

    const { error: eventError } = await admin.from('delivery_events').insert({
      order_id: orderId,
      rider_id: riderId,
      event_type: 'failed',
      client_event_id: clientEventId,
      failure_reason: reason,
      proof_image_path: proofImagePath,
      notes: notes || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    if (eventError) {
      if (eventError.code === '23505' && clientEventId) {
        return NextResponse.json(
          { success: true, alreadyRecorded: true, order: { id: order.id, status: 'failed' } },
          { status: 200 }
        );
      }

      throw eventError;
    }

    // Unassigned deliberately: the rider has moved on, and dispatch needs this
    // back in the queue to reassign or return to the store. The event keeps the
    // record of who attempted it.
    const { error: statusError } = await admin
      .from('orders')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        delivery_attempts: (order.delivery_attempts ?? 0) + 1,
        assigned_rider_id: null,
      })
      .eq('id', orderId);

    if (statusError) throw statusError;

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: 'failed',
          reason,
          delivery_attempts: (order.delivery_attempts ?? 0) + 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error recording failed delivery:', error);
    return NextResponse.json({ error: 'Could not record the failed delivery' }, { status: 500 });
  }
}
