import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { shopifyEnv, dashboardUrl } from '@/lib/env';
import { SHOP_DOMAIN_PATTERN, OAUTH_STATE_COOKIE, ShopifyAPI } from '@/lib/shopify';
import { verifyShopifyQueryHmac, timingSafeEqual } from '@/lib/webhook-verify';
import { reconcileWebhooks } from '@/lib/shopify-webhooks';

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

    // Shared with the install route, and sorts the parameters as Shopify's
    // spec requires - they usually arrive sorted, so skipping that appears to
    // work until the day it does not.
    if (!verifyShopifyQueryHmac(searchParams, shopifyEnv().apiSecret)) {
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
        // Deliberately not set. last_sync_at means "orders are imported up to
        // here", and at install nothing has been imported. Stamping it with
        // the install time made the first incremental sync look for orders
        // updated after install - so an existing store's history silently
        // never arrived.
        last_sync_at: null,
      }, {
        onConflict: 'shop_domain'
      })
      .select('id, shop_domain');

    if (dbError) {
      console.error('[OAuth Callback] Database error:', dbError);
      throw dbError;
    }

    console.log('[OAuth Callback] Stored config for', upsertData?.[0]?.shop_domain ?? shop);

    // Reconcile rather than blindly register: a reinstall would otherwise
    // stack duplicate webhooks, and a changed WEBHOOK_URL would leave the old
    // ones pointing nowhere.
    try {
      const result = await reconcileWebhooks(new ShopifyAPI(shop, access_token));

      if (result.failures.length > 0) {
        console.error('[OAuth Callback] Webhook reconciliation issues:', result.failures);
      }
    } catch (error) {
      // The install itself succeeded; surfacing a failure here would strand the
      // merchant. /api/webhooks/reconcile can repair it.
      console.error('[OAuth Callback] Webhook reconciliation failed:', error);
    }

    // Redirect to frontend dashboard
    const dashboard = dashboardUrl();
    const redirectResponse = NextResponse.redirect(`${dashboard}/dashboard`);
    redirectResponse.cookies.delete(OAUTH_STATE_COOKIE);
    return redirectResponse;

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Shopify install failed' }, { status: 500 });
  }
}

