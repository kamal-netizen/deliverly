import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';
import { getActiveShopifyConfig, ShopifyAPI } from '@/lib/shopify';
import { deleteOurWebhooks } from '@/lib/shopify-webhooks';

/**
 * Disconnect the Shopify store
 * POST /api/auth/shopify/disconnect
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const config = await getActiveShopifyConfig();

    if (!config) {
      return NextResponse.json(
        { success: true, message: 'No Shopify connection found (already disconnected)' },
        { status: 200 }
      );
    }

    // Remove only this app's webhooks. The previous version listed every
    // webhook on the store and deleted all of them, destroying the merchant's
    // own integrations and any other app's along with ours.
    let webhookResult = { deleted: 0, failed: 0 };

    try {
      const client = new ShopifyAPI(config.shop_domain, config.access_token);
      webhookResult = await deleteOurWebhooks(client);
    } catch (error) {
      // The store may already be uninstalled, which revokes the token. Carry on
      // and still clear local state.
      console.error('[Disconnect] Could not remove webhooks:', error);
    }

    const { error: deleteError } = await getSupabaseAdmin()
      .from('shopify_config')
      .delete()
      .eq('id', config.id);

    if (deleteError) {
      console.error('[Disconnect] Delete error:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      shopDomain: config.shop_domain,
      webhooksDeleted: webhookResult.deleted,
      webhooksFailed: webhookResult.failed,
    });
  } catch (error: any) {
    console.error('[Disconnect] Error:', error);
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 });
  }
}
