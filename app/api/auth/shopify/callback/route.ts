import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';
import { shopifyEnv } from '@/lib/env';
import { SHOP_DOMAIN_PATTERN, OAUTH_STATE_COOKIE } from '@/lib/shopify';

/**
 * Shopify OAuth - Step 2: Handle callback and exchange code for access token
 * GET /api/auth/shopify/callback?code=...&shop=...&state=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const hmac = searchParams.get('hmac');
    const state = searchParams.get('state');

    if (!code || !shop || !hmac || !state) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // `shop` becomes the host of the token-exchange request below, so it is
    // validated before being interpolated into any URL.
    if (!SHOP_DOMAIN_PATTERN.test(shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Verify the state nonce set in step 1. Without this the install flow has
    // no CSRF protection: the nonce used to be generated and then ignored.
    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

    if (!expectedState || !timingSafeEqual(state, expectedState)) {
      return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 401 });
    }

    // Verify HMAC
    const queryParams = new URLSearchParams(searchParams);
    queryParams.delete('hmac');
    const message = queryParams.toString();
    
    const hash = crypto
      .createHmac('sha256', shopifyEnv().apiSecret)
      .update(message)
      .digest('hex');

    if (!timingSafeEqual(hash, hmac)) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    console.log('[OAuth Callback] Storing config for shop:', shop);

    // Store access token in database (upsert)
    const now = new Date().toISOString();
    const { data: upsertData, error: dbError } = await getSupabaseAdmin()
      .from('shopify_config')
      .upsert({
        shop_domain: shop,
        access_token,
        scope,
        installed_at: now,
        last_sync_at: now
      }, {
        onConflict: 'shop_domain'
      })
      .select();

    if (dbError) {
      console.error('[OAuth Callback] Database error:', dbError);
      throw dbError;
    }

    console.log('[OAuth Callback] Successfully stored config:', upsertData);

    // Register webhooks
    await registerWebhooks(shop, access_token);

    // Redirect to frontend dashboard
    const dashboardUrl = process.env.FRONTEND_DASHBOARD_URL || process.env.NEXT_PUBLIC_APP_URL;
    const redirectResponse = NextResponse.redirect(`${dashboardUrl}/dashboard`);
    redirectResponse.cookies.delete(OAUTH_STATE_COOKIE);
    return redirectResponse;

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Register required webhooks
 */
async function registerWebhooks(shop: string, accessToken: string) {
  const webhookBaseUrl = process.env.WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL;
  
  console.log('[Webhook Registration] Starting for shop:', shop);
  console.log('[Webhook Registration] Base URL:', webhookBaseUrl);
  
  const webhooks = [
    {
      topic: 'orders/create',
      address: `${webhookBaseUrl}/api/webhooks/orders/create`,
      format: 'json'
    },
    {
      topic: 'orders/cancelled',
      address: `${webhookBaseUrl}/api/webhooks/orders/cancelled`,
      format: 'json'
    }
  ];

  for (const webhook of webhooks) {
    try {
      console.log(`[Webhook Registration] Registering ${webhook.topic} at ${webhook.address}`);
      const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhook })
      });
      
      const result = await response.json();
      if (response.ok) {
        console.log(`[Webhook Registration] SUCCESS ${webhook.topic}:`, result.webhook?.id);
      } else {
        console.error(`[Webhook Registration] FAILED ${webhook.topic}:`, result);
      }
    } catch (error) {
      console.error(`[Webhook Registration] ERROR ${webhook.topic}:`, error);
    }
  }
}

/**
 * Constant-time string comparison.
 *
 * crypto.timingSafeEqual throws when lengths differ, so lengths are compared
 * first and the throw is avoided rather than swallowed.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}
