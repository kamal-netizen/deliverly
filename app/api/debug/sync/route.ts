import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Check if Shopify is connected
    const { data: shopifyConfig } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, access_token')
      .single();

    if (!shopifyConfig?.access_token) {
      return NextResponse.json({
        error: 'Shopify not connected',
        solution: 'Complete OAuth at /api/auth/shopify?shop=deliverly-4.myshopify.com'
      }, { status: 400 });
    }

    // 2. Fetch orders from Shopify API
    const ordersResponse = await fetch(
      `https://${shopifyConfig.shop_domain}/admin/api/2026-01/orders.json?status=any&limit=5`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': shopifyConfig.access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    const shopifyOrders = await ordersResponse.json();

    // 3. Fetch orders from our database
    const { data: dbOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Check webhook logs
    const { data: webhookLogs } = await supabaseAdmin
      .from('webhook_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      shopifyConnected: true,
      shopifyShop: shopifyConfig.shop_domain,
      shopifyOrderCount: shopifyOrders.orders?.length || 0,
      shopifyOrders: shopifyOrders.orders?.map((o: any) => ({
        id: o.id,
        name: o.name,
        created_at: o.created_at,
        financial_status: o.financial_status
      })),
      databaseOrderCount: dbOrders?.length || 0,
      databaseOrders: dbOrders,
      webhookLogCount: webhookLogs?.length || 0,
      webhookLogs: webhookLogs,
    });
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
