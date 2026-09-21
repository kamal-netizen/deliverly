import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Check webhook logs and registration status
 * GET /api/webhooks/status
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    // Get Shopify config
    const { data: config, error: configError } = await getSupabaseAdmin()
      .from('shopify_config')
      .select('shop_domain, access_token')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[Webhook Status] Config query result:', { config, configError });

    if (configError || !config) {
      const origin = request.headers.get('origin');
      return NextResponse.json({
        error: 'Shopify not connected',
        details: configError?.message,
        webhooksRegistered: false
      }, { status: 404 });
    }

    // Fetch registered webhooks from Shopify
    let registeredWebhooks = [];
    try {
      const response = await fetch(
        `https://${config.shop_domain}/admin/api/2024-01/webhooks.json`,
        {
          headers: {
            'X-Shopify-Access-Token': config.access_token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        registeredWebhooks = data.webhooks || [];
      }
    } catch (error) {
      console.error('Error fetching webhooks from Shopify:', error);
    }

    // Get recent webhook logs
    const { data: logs } = await getSupabaseAdmin()
      .from('webhook_log')
      // Never select payload: it holds the entire Shopify order, i.e. customer
      // name, email, phone, address and line items.
      .select('id, topic, shopify_order_id, processed, error, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get webhook stats
    const { count: totalWebhooks } = await getSupabaseAdmin()
      .from('webhook_log')
      .select('*', { count: 'exact', head: true });

    const { count: processedWebhooks } = await getSupabaseAdmin()
      .from('webhook_log')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true);

    const { count: failedWebhooks } = await getSupabaseAdmin()
      .from('webhook_log')
      .select('*', { count: 'exact', head: true })
      .not('error', 'is', null);

    return NextResponse.json({
      webhooksRegistered: registeredWebhooks.length > 0,
      registeredWebhooks: registeredWebhooks.map((w: any) => ({
        id: w.id,
        topic: w.topic,
        address: w.address,
        createdAt: w.created_at
      })),
      webhookUrl: process.env.WEBHOOK_URL,
      stats: {
        total: totalWebhooks || 0,
        processed: processedWebhooks || 0,
        failed: failedWebhooks || 0
      },
      recentLogs: logs || []
    });

  } catch (error: any) {
    console.error('Error checking webhook status:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
