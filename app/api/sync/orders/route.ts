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

        // Extract customer info
        const customer = order.customer || {};
        const shippingAddress = order.shipping_address || {};
        const billingAddress = order.billing_address || {};

        const nameFromAddress = (address: any) => {
          if (!address) return '';
          if (address.name) return address.name;
          const parts = [address.first_name, address.last_name].filter(Boolean);
          return parts.join(' ');
        };

        const customerName =
          [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
          nameFromAddress(shippingAddress) ||
          nameFromAddress(billingAddress) ||
          order.email ||
          'Unknown';

        // Determine initial status based on Shopify fulfillment
        let status = 'pending';
        if (order.fulfillment_status === 'fulfilled') {
          status = 'delivered';
        } else if (order.financial_status === 'paid') {
          status = 'pending';
        }

        const orderData = {
          shopify_order_id: order.id,
          order_number: order.name,
          customer_name: customerName,
          customer_phone: customer.phone || shippingAddress.phone || billingAddress.phone || null,
          customer_email: customer.email || order.email || null,
          shipping_address: shippingAddress,
          line_items: order.line_items,
          total_price: parseFloat(order.total_price || '0'),
          subtotal_price: parseFloat(order.subtotal_price || '0'),
          total_tax: parseFloat(order.total_tax || '0'),
          total_discounts: parseFloat(order.total_discounts || '0'),
          currency: order.currency || 'AED',
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          payment_gateway_names: order.payment_gateway_names || [],
          tags: order.tags ? order.tags.split(',').map((t: string) => t.trim()) : [],
          note: order.note,
          order_url: `https://${config.shop_domain}/admin/orders/${order.id}`,
          created_at: order.created_at
        };

        const { error } = existing
          ? await supabaseAdmin
              .from('orders')
              .update(orderData)
              .eq('id', existing.id)
          : await supabaseAdmin
              .from('orders')
              .insert({
                id: crypto.randomUUID(),
                tracking_code: nanoid(10),
                status,
                ...orderData
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
