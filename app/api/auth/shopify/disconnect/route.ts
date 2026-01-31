import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { corsHeaders, handleOptions } from '@/lib/cors';

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

/**
 * Disconnect Shopify store
 * POST /api/auth/shopify/disconnect
 */
export async function POST(request: NextRequest) {
  try {
    // Get current Shopify config
    const { data: config, error: fetchError } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, access_token')
      .single();

    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin);

    if (fetchError || !config) {
      // If no config exists, it's already disconnected - return success
      return NextResponse.json({ 
        success: true,
        message: 'No Shopify connection found (already disconnected)' 
      }, { status: 200, headers });
    }

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

    // Clear Shopify config from database
    const { error: deleteError } = await supabaseAdmin
      .from('shopify_config')
      .delete()
      .eq('shop_domain', shop_domain);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Shopify disconnected successfully' 
    }, { headers });

  } catch (error: any) {
    console.error('Disconnect error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ 
      error: error.message || 'Failed to disconnect' 
    }, { status: 500, headers: corsHeaders(origin) });
  }
}
