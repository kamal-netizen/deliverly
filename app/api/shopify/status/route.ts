import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { corsHeaders, handleOptions } from '@/lib/cors';

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

/**
 * Get Shopify connection status
 * GET /api/shopify/status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Status] Checking Shopify connection status...');
    
    const { data, error } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, installed_at, last_sync_at')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[Status] Query result:', { data, error });

    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin);

    if (error || !data) {
      console.log('[Status] Returning NOT CONNECTED:', error?.message || 'No data found');
      return NextResponse.json({
        connected: false,
        shopDomain: null,
        lastSync: null
      }, { headers });
    }

    console.log('[Status] Returning CONNECTED:', data.shop_domain);
    return NextResponse.json({
      connected: true,
      shopDomain: data.shop_domain,
      lastSync: data.last_sync_at || data.installed_at
    }, { headers });

  } catch (error: any) {
    console.error('Status check error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      connected: false,
      shopDomain: null,
      lastSync: null
    }, { headers: corsHeaders(origin) });
  }
}
