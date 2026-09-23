import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/webhook-verify';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getActiveShopifyConfig, markWebhookSeen } from '@/lib/shopify';
import { mapShopifyOrderToRow } from '@/lib/shopify-orders';
import { shopifyEnv } from '@/lib/env';

/**
 * Webhook handler for orders/fulfilled
 * POST /api/webhooks/orders/fulfilled
 *
 * Fires whenever anything fulfils an order in Shopify - this app, another app,
 * another courier's integration, or a person clicking "Fulfil" in the admin.
 *
 * It exists because orders finished by somebody else were invisible here. The
 * app subscribed only to orders/create and orders/cancelled, so an order
 * handed to another courier stayed 'pending' in the dispatch queue
 * indefinitely: nothing in this system had happened to it, and nothing was
 * listening for the thing that had.
 *
 * Without this the same fact still arrives, but only on the next sync. For a
 * dispatcher deciding what to hand a rider this morning, "eventually" is not
 * the same as "now".
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
        topic: 'orders/fulfilled',
        shopify_order_id: payload.id,
        payload,
        processed: false,
      })
      .select('id')
      .single();

    logId = logRow?.id ?? null;

    try {
      const config = await getActiveShopifyConfig();

      // Only ever an update. An orders/fulfilled for an order this system has
      // never seen is not ours to insert: orders/create and sync own that, and
      // inserting here would race them into a duplicate.
      //
      // mapShopifyOrderToRow carries the Shopify-sourced columns only - notably
      // not `status`, which stays whatever the delivery lifecycle made it. A
      // rider's 'delivered' must survive this; what changes is
      // shopify_fulfillment_id, and that is what takes the order out of the
      // dispatch queue.
      const { error } = await admin
        .from('orders')
        .update(mapShopifyOrderToRow(payload, config?.shop_domain ?? null))
        .eq('shopify_order_id', payload.id);

      if (error) throw error;

      if (logId) {
        await admin.from('webhook_log').update({ processed: true }).eq('id', logId);
      }

      if (config) {
        await markWebhookSeen(config.id);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      const message = error?.message ?? 'Fulfillment processing failed';
      console.error('Fulfillment webhook error:', error);

      if (logId) {
        await admin.from('webhook_log').update({ error: message }).eq('id', logId);
      }

      // 500 so Shopify retries; reprocessing is idempotent.
      return NextResponse.json(
        { error: 'Fulfillment processing failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Fulfillment webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
