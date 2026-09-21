import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyShopifyQueryHmac } from '@/lib/webhook-verify';
import { shopifyEnv, appUrl } from '@/lib/env';
import { SHOP_DOMAIN_PATTERN, OAUTH_STATE_COOKIE } from '@/lib/shopify';

/**
 * Shopify-initiated install.
 * GET /api/auth/shopify/install?shop=…&hmac=…&timestamp=…
 *
 * When a merchant installs or opens the app from the Shopify admin, Shopify
 * sends them to the configured App URL with a signed query string and no
 * `code`. That is not the OAuth callback - it is the entry point, and the app
 * is expected to answer it by starting OAuth.
 *
 * Unlike /api/auth/shopify this requires no staff session, because the merchant
 * arriving from Shopify does not have one yet. The HMAC is the credential:
 * only Shopify can produce it, since only Shopify and this app hold the API
 * secret. Without that check this would be an open redirect into an OAuth grant.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const shop = params.get('shop');

    if (!shop || !SHOP_DOMAIN_PATTERN.test(shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    const { apiKey, apiSecret, scopes } = shopifyEnv();

    if (!verifyShopifyQueryHmac(params, apiSecret)) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const state = crypto.randomBytes(32).toString('hex');

    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', apiKey);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', `${appUrl()}/api/auth/shopify/callback`);
    authUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // The callback is a top-level navigation arriving from Shopify's domain,
      // so the cookie has to survive a cross-site redirect. 'lax' does for a
      // GET navigation; 'strict' would drop it and every install would fail
      // with "Invalid OAuth state".
      sameSite: 'lax',
      path: '/api/auth/shopify',
      maxAge: 600,
    });

    return response;
  } catch (error: any) {
    console.error('Shopify install entry error:', error);
    return NextResponse.json({ error: 'Could not start Shopify install' }, { status: 500 });
  }
}
