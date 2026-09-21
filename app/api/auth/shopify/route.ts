import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireStaff } from '@/lib/auth';
import { shopifyEnv, appUrl } from '@/lib/env';
import { SHOP_DOMAIN_PATTERN, OAUTH_STATE_COOKIE } from '@/lib/shopify';

/**
 * Shopify OAuth - Step 1: redirect to Shopify authorization
 * GET /api/auth/shopify?shop=store.myshopify.com
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) {
    // This is a top-level navigation, not an XHR, so send the operator to the
    // login page rather than answering with JSON they would never see.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Validated before interpolation: `shop` becomes the host of the URL we
    // redirect to, so a loose check here is an open-redirect.
    if (!SHOP_DOMAIN_PATTERN.test(shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    const { apiKey, scopes } = shopifyEnv();
    const redirectUri = `${appUrl()}/api/auth/shopify/callback`;

    // Cryptographically random, and actually remembered. The previous nonce came
    // from Math.random().toString(36).substring(7) and was never checked in the
    // callback, so the install flow had no CSRF protection at all.
    const state = crypto.randomBytes(32).toString('hex');

    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', apiKey);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/shopify',
      maxAge: 600,
    });

    return response;
  } catch (error: any) {
    console.error('OAuth start error:', error);
    return NextResponse.json({ error: 'Could not start Shopify install' }, { status: 500 });
  }
}
