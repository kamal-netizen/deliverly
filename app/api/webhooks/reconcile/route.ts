import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { createShopifyClient } from '@/lib/shopify';
import { reconcileWebhooks } from '@/lib/shopify-webhooks';

/**
 * Bring this app's Shopify webhooks in line with the current WEBHOOK_URL.
 * POST /api/webhooks/reconcile
 *
 * Replaces /api/webhooks/reset and /api/webhooks/cleanup, both of which were
 * unauthenticated and deleted every webhook on the merchant's store - including
 * other apps' and the merchant's own. This one only ever touches webhooks whose
 * topic and path belong to this app.
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const client = await createShopifyClient();

    if (!client) {
      return NextResponse.json({ error: 'Shopify not connected' }, { status: 404 });
    }

    const result = await reconcileWebhooks(client);

    return NextResponse.json({
      success: result.failures.length === 0,
      registered: result.registered.map((w) => ({ id: w.id, topic: w.topic, address: w.address })),
      deleted: result.deleted.map((w) => ({ id: w.id, topic: w.topic, address: w.address })),
      keptUntouched: result.kept.length,
      failures: result.failures,
    });
  } catch (error: any) {
    console.error('[Webhook Reconcile] Error:', error);
    return NextResponse.json({ error: 'Webhook reconciliation failed' }, { status: 500 });
  }
}
