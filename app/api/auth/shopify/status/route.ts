import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    // Check if Shopify credentials exist in database
    const { data: shopifyConfig, error } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, access_token')
      .single();

    if (error) {
      // Config table might not exist yet or no data
      return withCors(
        NextResponse.json({
          connected: false,
          shop: null,
        }),
        request
      );
    }

    const isConnected = !!(shopifyConfig?.access_token && shopifyConfig?.shop_domain);

    return withCors(
      NextResponse.json({
        connected: isConnected,
        shop: isConnected ? shopifyConfig.shop_domain : null,
      }),
      request
    );
  } catch (error) {
    console.error('Error checking Shopify status:', error);
    return withCors(
      NextResponse.json(
        { error: 'Failed to check Shopify status' },
        { status: 500 }
      ),
      request
    );
  }
}
