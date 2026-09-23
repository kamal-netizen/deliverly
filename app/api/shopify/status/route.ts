import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Get Shopify connection status
 * GET /api/shopify/status
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    
    const { data, error } = await getSupabaseAdmin()
      .from('shopify_config')
      .select('shop_domain, installed_at, last_sync_at, last_webhook_at')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();



    if (error || !data) {
      console.log('[Status] Returning NOT CONNECTED:', error?.message || 'No data found');
      return NextResponse.json({
        connected: false,
        shopDomain: null,
        lastSync: null
      });
    }

    console.log('[Status] Returning CONNECTED:', data.shop_domain);
    return NextResponse.json({
      connected: true,
      shopDomain: data.shop_domain,
      // The reconciliation cursor: everything up to here has been fetched from
      // Shopify. Only a completed sync moves it.
      lastSync: data.last_sync_at || data.installed_at,
      // Liveness, reported separately. Webhooks used to write lastSync to keep
      // this panel looking healthy, which corrupted the cursor and left the
      // app permanently blind to fulfilments on existing orders. Two facts,
      // two fields.
      lastWebhook: data.last_webhook_at ?? null
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({
      connected: false,
      shopDomain: null,
      lastSync: null
    });
  }
}
