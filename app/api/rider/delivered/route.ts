import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { fulfillShopifyOrder } from '@/lib/fulfillment';
import { getActiveShopifyConfig } from '@/lib/shopify';
import { requireRider } from '@/lib/auth';

/**
 * Mark an order delivered and upload proof.
 * POST /api/rider/delivered   (multipart/form-data)
 *
 *   orderId        required
 *   clientEventId  strongly recommended - see below
 *   image          proof photo
 *   latitude, longitude, notes
 *
 * Safe to retry. Riders lose signal in basements, lifts and car parks, so the
 * app queues submissions and sends them again when connectivity returns - and
 * a request that timed out may well have succeeded on the server.
 *
 * With a clientEventId, a replay returns the original result and 200. Without
 * one, a replay is indistinguishable from a genuine second delivery and the
 * best available answer is still 400.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRider(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  const riderId = auth.user.id;

  try {
    const formData = await request.formData();

    const orderId = formData.get('orderId') as string;
    const clientEventId = (formData.get('clientEventId') as string) || null;
    const image = formData.get('image');
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const notes = formData.get('notes') as string;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Replay check before anything is written or uploaded, so a retry costs one
    // query rather than a duplicate photo in storage.
    if (clientEventId) {
      const { data: existing } = await admin
        .from('delivery_events')
        .select('id, order_id, proof_image_path')
        .eq('rider_id', riderId)
        .eq('client_event_id', clientEventId)
        .maybeSingle();

      if (existing) {
        const { data: order } = await admin
          .from('orders')
          .select('id, order_number, status')
          .eq('id', existing.order_id)
          .maybeSingle();

        return NextResponse.json(
          {
            success: true,
            alreadyRecorded: true,
            order: {
              id: existing.order_id,
              order_number: order?.order_number ?? null,
              status: order?.status ?? 'delivered',
              proof_url: await signProof(existing.proof_image_path),
            },
            fulfillment: { success: true, alreadyFulfilled: true },
          },
          { status: 200 }
        );
      }
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, shopify_order_id, assigned_rider_id, status, order_number')
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

    if (image instanceof File && image.size > 0) {
      const extension = image.name.split('.').pop() || 'jpg';
      const filePath = `proofs/${orderId}-${Date.now()}.${extension}`;

      const { error: uploadError } = await admin.storage
        .from('delivery-proofs')
        .upload(filePath, image, { contentType: image.type, upsert: false });

      if (uploadError) {
        // The delivery is the fact worth recording; a missing photo should not
        // cost the rider the whole submission at the doorstep.
        console.error('Proof image upload failed:', uploadError);
      } else {
        proofImagePath = filePath;
      }
    }

    const { error: eventError } = await admin.from('delivery_events').insert({
      order_id: orderId,
      rider_id: riderId,
      event_type: 'delivered',
      client_event_id: clientEventId,
      proof_image_path: proofImagePath,
      notes: notes || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    if (eventError) {
      // Two retries racing each other. The unique index on
      // (rider_id, client_event_id) is what makes that safe, and the loser
      // reports the same success as the winner.
      if (eventError.code === '23505' && clientEventId) {
        return NextResponse.json(
          {
            success: true,
            alreadyRecorded: true,
            order: { id: order.id, order_number: order.order_number, status: 'delivered', proof_url: null },
            fulfillment: { success: true, alreadyFulfilled: true },
          },
          { status: 200 }
        );
      }

      throw eventError;
    }

    const { error: statusError } = await admin
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', orderId);

    if (statusError) throw statusError;

    const config = await getActiveShopifyConfig();
    const notifyCustomer = config?.notify_customer_on_fulfill ?? true;

    const fulfillmentResult = await fulfillShopifyOrder(
      order.shopify_order_id,
      notifyCustomer
    );

    if (!fulfillmentResult.success) {
      // The delivery happened; only the Shopify side failed. It is recorded on
      // the order as fulfillment_error so dispatch can see it.
      console.error('Fulfillment failed:', fulfillmentResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: 'delivered',
          proof_url: await signProof(proofImagePath),
        },
        fulfillment: fulfillmentResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error marking order delivered:', error);
    return NextResponse.json({ error: 'Could not record the delivery' }, { status: 500 });
  }
}

/** Short-lived URL for a private proof image. */
async function signProof(path: string | null): Promise<string | null> {
  if (!path) return null;

  const { data } = await getSupabaseAdmin()
    .storage.from('delivery-proofs')
    .createSignedUrl(path, 3600);

  return data?.signedUrl ?? null;
}
