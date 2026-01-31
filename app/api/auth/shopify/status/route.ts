import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if Shopify credentials exist in database
    const { data: settings, error } = await supabase
      .from('settings')
      .select('shopify_access_token, shopify_shop')
      .single();

    if (error) {
      // Settings table might not exist yet or no data
      return withCors(
        NextResponse.json({
          connected: false,
          shop: null,
        }),
        request
      );
    }

    const isConnected = !!(settings?.shopify_access_token && settings?.shopify_shop);

    return withCors(
      NextResponse.json({
        connected: isConnected,
        shop: isConnected ? settings.shopify_shop : null,
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
