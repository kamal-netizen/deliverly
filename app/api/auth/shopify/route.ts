import { NextRequest, NextResponse } from 'next/server';

/**
 * Shopify OAuth - Step 1: Redirect to Shopify authorization
 * GET /api/auth/shopify?shop=store.myshopify.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Validate shop domain
    if (!shop.endsWith('.myshopify.com')) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    const apiKey = process.env.SHOPIFY_API_KEY!;
    const scopes = process.env.SHOPIFY_SCOPES || 'read_orders,write_orders,write_fulfillments';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`;
    const nonce = Math.random().toString(36).substring(7);

    // Build authorization URL
    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', apiKey);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', nonce);

    return NextResponse.redirect(authUrl.toString());

  } catch (error: any) {
    console.error('OAuth start error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
