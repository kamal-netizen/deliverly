import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/webhook-verify';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getActiveShopifyConfig, markWebhookSeen } from '@/lib/shopify';
import { mapShopifyOrderToRow, initialStatusFor } from '@/lib/shopify-orders';
import { shopifyEnv } from '@/lib/env';
import { nanoid } from 'nanoid';

/**
 * Webhook handler for orders/create
 * POST /api/webhooks/orders/create
 */
export async function POST(request: NextRequest) {
  let logId: string | null = null;

  try {
    // Raw body first: the HMAC is over the exact bytes Shopify sent.
    const rawBody = await request.text();

    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');

    if (!hmac || !verifyShopifyWebhook(rawBody, hmac, shopifyEnv().webhookSecret)) {
      console.error('Webhook HMAC verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const admin = getSupabaseAdmin();

    // Capture the row id so the outcome updates this delivery only. Matching on
    // (shopify_order_id, topic) marked every historical log row for the order as
    // processed whenever Shopify redelivered.
    const { data: logRow } = await admin
      .from('webhook_log')
      .insert({
        topic: 'orders/create',
        shopify_order_id: payload.id,
        payload,
        processed: false,
      })
      .select('id')
      .single();

    logId = logRow?.id ?? null;

    try {
      await processOrderWebhook(payload);

      if (logId) {
        await admin.from('webhook_log').update({ processed: true }).eq('id', logId);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      const message = error?.message ?? 'Order processing failed';
      console.error('Order processing error:', error);

      if (logId) {
        await admin.from('webhook_log').update({ error: message }).eq('id', logId);
      }

      // Answer 500 so Shopify retries. The previous version logged the failure
      // and returned 200, which told Shopify the order was handled - so a
      // transient database error silently lost the order for good. Reprocessing
      // is safe: the insert below is idempotent on shopify_order_id.
      return NextResponse.json({ error: 'Order processing failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

async function processOrderWebhook(payload: any) {
  const admin = getSupabaseAdmin();
  const config = await getActiveShopifyConfig();

  const row = mapShopifyOrderToRow(payload, config?.shop_domain ?? null);

  const { error } = await admin.from('orders').insert({
    ...row,
    tracking_code: nanoid(10),
    status: initialStatusFor(payload),
  });

  if (error) {
    // A redelivery of an order we already have. Distinguish it from a
    // tracking_code collision, which is also a 23505 but means the opposite -
    // the old code treated both as "already exists" and dropped the order.
    if (error.code === '23505') {
      const constraint = String((error as any).details ?? '') + String(error.message ?? '');

      if (constraint.includes('tracking_code')) {
        throw new Error('Tracking code collision; retry will generate a new one');
      }

      console.log(`Order ${payload.id} already exists, skipping`);
      return;
    }

    throw error;
  }

  if (config) {
    await markWebhookSeen(config.id);
  }

  console.log(`Order ${payload.name} (${payload.id}) created`);
}
