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
 * Clean up old/duplicate webhooks and keep only current ones
 * POST /api/webhooks/cleanup
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

    let deleted = [];
    let kept = [];

    // Delete webhooks that don't match current URL
    for (const webhook of allWebhooks) {
      const shouldDelete = !webhook.address.startsWith(currentWebhookUrl);
      
      if (shouldDelete) {
        // Delete old webhook
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
          console.log(`[Webhook Cleanup] Deleted ${webhook.topic} - ${webhook.address}`);
        }
      } else {
        kept.push({
          id: webhook.id,
          topic: webhook.topic,
          address: webhook.address
        });
      }
    }

    // Check if we have the required webhooks, if not register them
    const requiredTopics = ['orders/create', 'orders/cancelled'];
    const existingTopics = kept.map(w => w.topic);
    const missing = requiredTopics.filter(topic => !existingTopics.includes(topic));

    let registered = [];
    for (const topic of missing) {
      const webhookPath = topic === 'orders/create' ? 'orders/create' : 'orders/cancelled';
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
              topic,
              address: `${currentWebhookUrl}/api/webhooks/${webhookPath}`,
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
        console.log(`[Webhook Cleanup] Registered ${topic}`);
      }
    }

    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: true,
      currentWebhookUrl,
      deleted: deleted.length,
      kept: kept.length,
      registered: registered.length,
      details: {
        deleted,
        kept,
        registered
      }
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Error cleaning up webhooks:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      error: error.message
    }, { status: 500, headers: corsHeaders(origin) });
  }
}
