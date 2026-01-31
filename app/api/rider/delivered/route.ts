import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fulfillShopifyOrder } from '@/lib/fulfillment';

/**
 * Mark order as delivered and upload proof
 * POST /api/rider/delivered
 */
export async function POST(request: NextRequest) {
  try {
    // Get rider ID from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const riderId = user.id;

    // Parse multipart form data
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const image = formData.get('image') as File;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const notes = formData.get('notes') as string;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Verify order is assigned to this rider
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, shopify_order_id, assigned_rider_id, status, order_number')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assigned_rider_id !== riderId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status === 'delivered' || order.status === 'fulfilled') {
      return NextResponse.json({ error: 'Order already delivered' }, { status: 400 });
    }

    let proofImagePath = null;

    // Upload proof image if provided
    if (image) {
      const fileName = `${orderId}-${Date.now()}.${image.name.split('.').pop()}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('delivery-proofs')
        .upload(filePath, image, {
          contentType: image.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
      } else {
        proofImagePath = filePath;
      }
    }

    // Create delivery event
    await supabaseAdmin.from('delivery_events').insert({
      id: crypto.randomUUID(),
      order_id: orderId,
      rider_id: riderId,
      event_type: 'delivered',
      proof_image_path: proofImagePath,
      notes: notes || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    });

    // Update order status
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Get notify_customer setting
    const { data: config } = await supabaseAdmin
      .from('shopify_config')
      .select('notify_customer_on_fulfill')
      .single();

    const notifyCustomer = config?.notify_customer_on_fulfill ?? true;

    // Fulfill in Shopify
    const fulfillmentResult = await fulfillShopifyOrder(
      order.shopify_order_id,
      notifyCustomer
    );

    if (!fulfillmentResult.success) {
      console.error('Fulfillment failed:', fulfillmentResult.error);
      // Don't fail the entire request - order is still marked delivered
    }

    // Generate signed URL for proof image
    let proofUrl = null;
    if (proofImagePath) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('delivery-proofs')
        .createSignedUrl(proofImagePath, 3600); // 1 hour

      proofUrl = signedUrlData?.signedUrl;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: 'delivered',
        proof_url: proofUrl
      },
      fulfillment: fulfillmentResult
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error marking order delivered:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
