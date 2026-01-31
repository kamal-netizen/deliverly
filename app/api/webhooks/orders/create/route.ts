import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/webhook-verify';
import { supabaseAdmin } from '@/lib/supabase-server';
import { nanoid } from 'nanoid';

/**
 * Webhook handler for orders/create
 * Shopify fires this when a new order is created
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body FIRST (before any parsing)
    const rawBody = await request.text();
    
    // 2. Verify HMAC signature
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;

    if (!hmac || !verifyShopifyWebhook(rawBody, hmac, secret)) {
      console.error('Webhook HMAC verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Parse payload
    const payload = JSON.parse(rawBody);
    
    // 4. Log webhook (for debugging and retry handling)
    await supabaseAdmin.from('webhook_log').insert({
      topic: 'orders/create',
      shopify_order_id: payload.id,
      payload,
      processed: false
    });

    // 5. Process order synchronously (Vercel constraint)
    try {
      await processOrderWebhook(payload);
      
      // Mark as processed
      await supabaseAdmin
        .from('webhook_log')
        .update({ processed: true })
        .eq('shopify_order_id', payload.id)
        .eq('topic', 'orders/create');

      // Update last sync timestamp
      await supabaseAdmin
        .from('shopify_config')
        .update({ last_sync_at: new Date().toISOString() })
        .not('id', 'is', null);

    } catch (error: any) {
      console.error('Order processing error:', error);
      
      // Log error but still return 200 to avoid retries
      await supabaseAdmin
        .from('webhook_log')
        .update({ error: error.message })
        .eq('shopify_order_id', payload.id)
        .eq('topic', 'orders/create');
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Process order webhook and save to database
 */
async function processOrderWebhook(payload: any) {
  const trackingCode = nanoid(10);

  const { data: config } = await supabaseAdmin
    .from('shopify_config')
    .select('shop_domain')
    .single();

  // Extract customer info
  const customer = payload.customer || {};
  const shippingAddress = payload.shipping_address || {};
  
  const customerName = customer.first_name && customer.last_name
    ? `${customer.first_name} ${customer.last_name}`
    : customer.first_name || customer.last_name || 'Unknown';

  let status = 'pending';
  if (payload.fulfillment_status === 'fulfilled') {
    status = 'delivered';
  } else if (payload.financial_status === 'paid') {
    status = 'pending';
  }

  // Insert order into database
  const { error } = await supabaseAdmin.from('orders').insert({
    id: crypto.randomUUID(),
    shopify_order_id: payload.id,
    order_number: payload.name,
    customer_name: customerName,
    customer_phone: customer.phone || shippingAddress.phone,
    customer_email: customer.email,
    shipping_address: shippingAddress,
    line_items: payload.line_items,
    total_price: parseFloat(payload.total_price || '0'),
    subtotal_price: parseFloat(payload.subtotal_price || '0'),
    total_tax: parseFloat(payload.total_tax || '0'),
    total_discounts: parseFloat(payload.total_discounts || '0'),
    currency: payload.currency || 'AED',
    financial_status: payload.financial_status,
    fulfillment_status: payload.fulfillment_status,
    payment_gateway_names: payload.payment_gateway_names || [],
    tags: payload.tags ? payload.tags.split(',').map((t: string) => t.trim()) : [],
    note: payload.note,
    order_url: config?.shop_domain
      ? `https://${config.shop_domain}/admin/orders/${payload.id}`
      : null,
    tracking_code: trackingCode,
    status,
    created_at: payload.created_at
  });

  if (error) {
    // Handle duplicate order (webhook retry)
    if (error.code === '23505') { // Unique violation
      console.log(`Order ${payload.id} already exists, skipping`);
      return;
    }
    throw error;
  }

  console.log(`Order ${payload.name} (${payload.id}) created with tracking: ${trackingCode}`);
}
