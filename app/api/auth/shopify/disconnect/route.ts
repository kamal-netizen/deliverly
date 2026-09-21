import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Disconnect Shopify store
 * POST /api/auth/shopify/disconnect
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    // Get current Shopify config
    const { data: configs, error: fetchError } = await getSupabaseAdmin()
      .from('shopify_config')
      .select('shop_domain, access_token');


    if (fetchError) {
      console.error('[Disconnect] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!configs || configs.length === 0) {
      // If no config exists, it's already disconnected - return success
      return NextResponse.json({ 
        success: true,
        message: 'No Shopify connection found (already disconnected)' 
      }, { status: 200 });
    }

    // Process first config (or all configs if multiple exist)
    const config = configs[0];
    const { shop_domain, access_token } = config;

    // Delete all webhooks from Shopify
    if (shop_domain && access_token) {
      try {
        // Get all webhooks
        const webhooksResponse = await fetch(
          `https://${shop_domain}/admin/api/2024-01/webhooks.json`,
          {
            headers: {
              'X-Shopify-Access-Token': access_token,
              'Content-Type': 'application/json'
            }
          }
        );

        if (webhooksResponse.ok) {
          const { webhooks } = await webhooksResponse.json();
          
          // Delete each webhook
          for (const webhook of webhooks || []) {
            await fetch(
              `https://${shop_domain}/admin/api/2024-01/webhooks/${webhook.id}.json`,
              {
                method: 'DELETE',
                headers: {
                  'X-Shopify-Access-Token': access_token
                }
              }
            );
          }
        }
      } catch (webhookError) {
        console.error('Error deleting webhooks:', webhookError);
        // Continue even if webhook deletion fails
      }
    }

    // Clear ALL Shopify configs from database
    const { error: deleteError } = await getSupabaseAdmin()
      .from('shopify_config')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('[Disconnect] Delete error:', deleteError);
      throw deleteError;
    }

    console.log('[Disconnect] Successfully deleted all Shopify configs');

    return NextResponse.json({ 
      success: true, 
      message: 'Shopify disconnected successfully' 
    });

  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to disconnect' 
    }, { status: 500 });
  }
}
