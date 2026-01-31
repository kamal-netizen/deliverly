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
 * Force reset: Delete ALL webhooks and register fresh ones
 * POST /api/webhooks/reset
 */
export async function POST(request: NextRequest) {
  try {
    // Get Shopify config
    const { data: config } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, access_token')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!config) {
      const origin = request.headers.get('origin');
      return NextResponse.json({
        error: 'Shopify not connected'
      }, { status: 404, headers: corsHeaders(origin) });
    }

    const currentWebhookUrl = process.env.WEBHOOK_URL;
    
    console.log('[Webhook Reset] Current webhook URL:', currentWebhookUrl);
    
    // Fetch all registered webhooks from Shopify
    const response = await fetch(
      `https://${config.shop_domain}/admin/api/2024-01/webhooks.json`,
      {
        headers: {
          'X-Shopify-Access-Token': config.access_token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch webhooks from Shopify');
    }

    const data = await response.json();
    const allWebhooks = data.webhooks || [];

    console.log('[Webhook Reset] Found webhooks:', allWebhooks.length);

    let deleted = [];

    // Delete ALL webhooks
    for (const webhook of allWebhooks) {
      console.log(`[Webhook Reset] Deleting ${webhook.id} - ${webhook.topic} - ${webhook.address}`);
      
      const deleteResponse = await fetch(
        `https://${config.shop_domain}/admin/api/2024-01/webhooks/${webhook.id}.json`,
        {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': config.access_token
          }
        }
      );

      if (deleteResponse.ok) {
        deleted.push({
          id: webhook.id,
          topic: webhook.topic,
          address: webhook.address
        });
        console.log(`[Webhook Reset] ✓ Deleted ${webhook.topic}`);
      } else {
        console.error(`[Webhook Reset] ✗ Failed to delete ${webhook.topic}:`, await deleteResponse.text());
      }
    }

    // Register fresh webhooks
    const webhooks = [
      {
        topic: 'orders/create',
        address: `${currentWebhookUrl}/api/webhooks/orders/create`,
      },
      {
        topic: 'orders/cancelled',
        address: `${currentWebhookUrl}/api/webhooks/orders/cancelled`,
      }
    ];

    let registered = [];
    for (const webhook of webhooks) {
      console.log(`[Webhook Reset] Registering ${webhook.topic} at ${webhook.address}`);
      
      const registerResponse = await fetch(
        `https://${config.shop_domain}/admin/api/2024-01/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': config.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: {
              topic: webhook.topic,
              address: webhook.address,
              format: 'json'
            }
          })
        }
      );

      if (registerResponse.ok) {
        const result = await registerResponse.json();
        registered.push({
          id: result.webhook.id,
          topic: result.webhook.topic,
          address: result.webhook.address
        });
        console.log(`[Webhook Reset] ✓ Registered ${webhook.topic} - ID: ${result.webhook.id}`);
      } else {
        const errorText = await registerResponse.text();
        console.error(`[Webhook Reset] ✗ Failed to register ${webhook.topic}:`, errorText);
      }
    }

    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: true,
      currentWebhookUrl,
      deleted: deleted.length,
      registered: registered.length,
      details: {
        deleted,
        registered
      }
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('[Webhook Reset] Error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      error: error.message
    }, { status: 500, headers: corsHeaders(origin) });
  }
}
