import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/webhook-verify';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getActiveShopifyConfig, markSynced } from '@/lib/shopify';
import { shopifyEnv } from '@/lib/env';

/**
 * Webhook handler for orders/cancelled
 * POST /api/webhooks/orders/cancelled
 */
export async function POST(request: NextRequest) {
  let logId: string | null = null;

  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');

    if (!hmac || !verifyShopifyWebhook(rawBody, hmac, shopifyEnv().webhookSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const admin = getSupabaseAdmin();

    const { data: logRow } = await admin
      .from('webhook_log')
      .insert({
        topic: 'orders/cancelled',
        shopify_order_id: payload.id,
        payload,
        processed: false,
      })
      .select('id')
      .single();

    logId = logRow?.id ?? null;

    try {
      await processCancellationWebhook(payload);

      if (logId) {
        await admin.from('webhook_log').update({ processed: true }).eq('id', logId);
      }

      const config = await getActiveShopifyConfig();
      if (config) {
        await markSynced(config.id);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      const message = error?.message ?? 'Cancellation processing failed';
      console.error('Cancellation processing error:', error);

      if (logId) {
        await admin.from('webhook_log').update({ error: message }).eq('id', logId);
      }

      // 500 so Shopify retries; reprocessing is idempotent.
      return NextResponse.json({ error: 'Cancellation processing failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

async function processCancellationWebhook(payload: any) {
  const admin = getSupabaseAdmin();

  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('id, assigned_rider_id, status')
    .eq('shopify_order_id', payload.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!order) {
    console.log(`Order ${payload.id} not found in database`);
    return;
  }

  // Always record the event: a cancellation is a fact about the order whatever
  // its delivery state.
  const { error: eventError } = await admin.from('delivery_events').insert({
    order_id: order.id,
    rider_id: order.assigned_rider_id,
    event_type: 'cancelled',
    notes: 'Order cancelled in Shopify',
  });

  if (eventError) {
    throw eventError;
  }

  // Only move the status if the delivery has not already happened. Cancelling
  // an order the rider already handed over is a refund, not a reversal of
  // physical reality - and overwriting it would destroy the delivery record,
  // including the proof photo's link to a delivered order.
  if (order.status !== 'pending' && order.status !== 'assigned') {
    console.log(
      `Order ${payload.id} is ${order.status}; recorded the cancellation without changing status`
    );
    return;
  }

  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'cancelled', assigned_rider_id: null })
    .eq('id', order.id);

  if (updateError) {
    throw updateError;
  }

  console.log(`Order ${payload.name} (${payload.id}) cancelled`);
}
