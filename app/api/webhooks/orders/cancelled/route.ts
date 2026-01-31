import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/webhook-verify';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Webhook handler for orders/cancelled
 * Shopify fires this when an order is cancelled
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body and verify HMAC
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;

    if (!hmac || !verifyShopifyWebhook(rawBody, hmac, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(rawBody);
    
    // 3. Log webhook
    await supabaseAdmin.from('webhook_log').insert({
      topic: 'orders/cancelled',
      shopify_order_id: payload.id,
      payload,
      processed: false
    });

    // 4. Process cancellation
    try {
      await processCancellationWebhook(payload);
      
      await supabaseAdmin
        .from('webhook_log')
        .update({ processed: true })
        .eq('shopify_order_id', payload.id)
        .eq('topic', 'orders/cancelled');

      // Update last sync timestamp
      await supabaseAdmin
        .from('shopify_config')
        .update({ last_sync_at: new Date().toISOString() })
        .not('id', 'is', null);

    } catch (error: any) {
      console.error('Cancellation processing error:', error);
      
      await supabaseAdmin
        .from('webhook_log')
        .update({ error: error.message })
        .eq('shopify_order_id', payload.id)
        .eq('topic', 'orders/cancelled');
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processCancellationWebhook(payload: any) {
  // Update order status to cancelled
  const { data: order, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, assigned_rider_id')
    .eq('shopify_order_id', payload.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') { // Not found
      console.log(`Order ${payload.id} not found in database`);
      return;
    }
    throw fetchError;
  }

  // Update order status
  await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('shopify_order_id', payload.id);

  // Create cancellation event
  if (order.assigned_rider_id) {
    await supabaseAdmin.from('delivery_events').insert({
      order_id: order.id,
      rider_id: order.assigned_rider_id,
      event_type: 'cancelled',
      notes: 'Order cancelled in Shopify'
    });
  }

  console.log(`Order ${payload.name} (${payload.id}) cancelled`);
}
