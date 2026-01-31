import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { nanoid } from 'nanoid';

/**
 * Manual sync endpoint to pull all orders from Shopify
 * GET /api/sync/orders
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get Shopify credentials
    const { data: config } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, access_token')
      .single();

    if (!config?.access_token) {
      return NextResponse.json({
        error: 'Shopify not connected'
      }, { status: 400 });
    }

    // 2. Fetch all orders from Shopify (last 250 orders)
    const response = await fetch(
      `https://${config.shop_domain}/admin/api/2024-01/orders.json?status=any&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': config.access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Failed to fetch from Shopify',
        details: errorText
      }, { status: 500 });
    }

    const { orders } = await response.json();

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        message: 'No orders found in Shopify',
        synced: 0
      });
    }

    // 3. Sync each order to database
    let synced = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const order of orders) {
      try {
        // Check if order already exists
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('shopify_order_id', order.id)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Extract customer info
        const customer = order.customer || {};
        const shippingAddress = order.shipping_address || {};
        
        const customerName = customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`
          : customer.first_name || customer.last_name || 'Unknown';

        // Determine initial status based on Shopify fulfillment
        let status = 'pending';
        if (order.fulfillment_status === 'fulfilled') {
          status = 'delivered';
        } else if (order.financial_status === 'paid') {
          status = 'pending';
        }

        // Insert order
        const { error } = await supabaseAdmin.from('orders').insert({
          id: crypto.randomUUID(),
          shopify_order_id: order.id,
          order_number: order.name,
          customer_name: customerName,
          customer_phone: customer.phone || shippingAddress.phone,
          customer_email: customer.email,
          shipping_address: shippingAddress,
          line_items: order.line_items,
          total_price: parseFloat(order.total_price || '0'),
          tracking_code: nanoid(10),
          status,
          created_at: order.created_at
        });

        if (error) {
          errors.push({ order_id: order.id, error: error.message });
        } else {
          synced++;
        }

      } catch (err: any) {
        errors.push({ order_id: order.id, error: err.message });
      }
    }

    // 4. Update last sync timestamp
    await supabaseAdmin
      .from('shopify_config')
      .update({ last_sync_at: new Date().toISOString() })
      .not('id', 'is', null);

    return NextResponse.json({
      success: true,
      total: orders.length,
      synced,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
