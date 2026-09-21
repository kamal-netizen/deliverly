import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';
import { getActiveShopifyConfig, ShopifyAPI } from '@/lib/shopify';
import { listWebhooks, isOurs, OUR_TOPICS, addressFor } from '@/lib/shopify-webhooks';

/**
 * Webhook registration and processing health.
 * GET /api/webhooks/status
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const config = await getActiveShopifyConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Shopify not connected', webhooksRegistered: false },
        { status: 404 }
      );
    }

    // Distinguish "no webhooks registered" from "could not reach Shopify".
    // Collapsing the two used to report a false negative, which is exactly the
    // signal that pushed an operator toward the destructive cleanup route.
    let ourWebhooks: { id: number; topic: string; address: string }[] = [];
    let shopifyReachable = true;

    try {
      const client = new ShopifyAPI(config.shop_domain, config.access_token);
      ourWebhooks = (await listWebhooks(client))
        .filter(isOurs)
        .map((w) => ({ id: w.id, topic: w.topic, address: w.address }));
    } catch (error) {
      console.error('Error fetching webhooks from Shopify:', error);
      shopifyReachable = false;
    }

    const expected = OUR_TOPICS.map((topic) => {
      const address = addressFor(topic);
      return {
        topic,
        address,
        registered: ourWebhooks.some(
          (w) => w.topic === topic && w.address === address
        ),
      };
    });

    const { data: logs } = await getSupabaseAdmin()
      .from('webhook_log')
      // Never select payload: it holds the entire Shopify order, i.e. customer
      // name, email, phone, address and line items.
      .select('id, topic, shopify_order_id, processed, error, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const admin = getSupabaseAdmin();

    const [{ count: total }, { count: processed }, { count: failed }] =
      await Promise.all([
        admin.from('webhook_log').select('*', { count: 'exact', head: true }),
        admin
          .from('webhook_log')
          .select('*', { count: 'exact', head: true })
          .eq('processed', true),
        admin
          .from('webhook_log')
          .select('*', { count: 'exact', head: true })
          .not('error', 'is', null),
      ]);

    return NextResponse.json({
      shopifyReachable,
      webhooksRegistered: shopifyReachable && expected.every((e) => e.registered),
      expected,
      stats: {
        total: total || 0,
        processed: processed || 0,
        failed: failed || 0,
      },
      recentLogs: logs || [],
    });
  } catch (error: any) {
    console.error('Error checking webhook status:', error);
    return NextResponse.json({ error: 'Could not read webhook status' }, { status: 500 });
  }
}
