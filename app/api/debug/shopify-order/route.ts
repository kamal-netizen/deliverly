import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * Debug endpoint: Fetch one full order from Shopify to inspect customer data
 */
export async function GET(request: NextRequest) {
  try {
    const { data: config } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain, access_token')
      .single();

    if (!config?.access_token) {
      return NextResponse.json({
        error: 'Shopify not connected'
      }, { status: 400 });
    }

    // Fetch latest order with full details
    const response = await fetch(
      `https://${config.shop_domain}/admin/api/2024-01/orders.json?status=any&limit=1`,
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
    const order = orders[0];

    if (!order) {
      return NextResponse.json({
        error: 'No orders found in Shopify'
      }, { status: 404 });
    }

    // Fetch full customer details if customer ID exists
    let fullCustomer = null;
    if (order.customer?.id) {
      const customerResponse = await fetch(
        `https://${config.shop_domain}/admin/api/2024-01/customers/${order.customer.id}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': config.access_token,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (customerResponse.ok) {
        const { customer } = await customerResponse.json();
        fullCustomer = customer;
      }
    }

    // Extract and show what's available
    return NextResponse.json({
      order_id: order.id,
      order_number: order.name,
      created_at: order.created_at,
      
      // Customer object from order
      has_customer_object: !!order.customer,
      customer_from_order: order.customer,
      
      // Full customer fetched separately
      full_customer: fullCustomer,
      
      // Email at order level
      order_email: order.email,
      order_phone: order.phone,
      
      // Shipping address
      has_shipping_address: !!order.shipping_address,
      shipping_address: order.shipping_address,
      
      // Billing address
      has_billing_address: !!order.billing_address,
      billing_address: order.billing_address,
      
      // What would be extracted with current code
      extracted_name: extractCustomerName(order),
      extracted_phone: extractCustomerPhone(order),
      extracted_email: extractCustomerEmail(order),
      
      // What would be extracted with full customer
      extracted_name_with_full_customer: fullCustomer ? extractCustomerNameFromFull(order, fullCustomer) : null,
      extracted_phone_with_full_customer: fullCustomer ? extractCustomerPhoneFromFull(order, fullCustomer) : null,
      extracted_email_with_full_customer: fullCustomer ? extractCustomerEmailFromFull(order, fullCustomer) : null,
      
      // Full order for reference
      full_order: order
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

function extractCustomerName(order: any): string {
  const customer = order.customer || {};
  const shippingAddress = order.shipping_address || {};
  const billingAddress = order.billing_address || {};

  const nameFromAddress = (address: any) => {
    if (!address) return '';
    if (address.name) return address.name;
    const parts = [address.first_name, address.last_name].filter(Boolean);
    return parts.join(' ');
  };

  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
    nameFromAddress(shippingAddress) ||
    nameFromAddress(billingAddress) ||
    order.email ||
    'Unknown'
  );
}

function extractCustomerPhone(order: any): string | null {
  const customer = order.customer || {};
  const shippingAddress = order.shipping_address || {};
  const billingAddress = order.billing_address || {};
  
  return customer.phone || shippingAddress.phone || billingAddress.phone || order.phone || null;
}

function extractCustomerEmail(order: any): string | null {
  const customer = order.customer || {};
  return customer.email || order.email || null;
}

function extractCustomerNameFromFull(order: any, fullCustomer: any): string {
  const nameFromAddress = (address: any) => {
    if (!address) return '';
    if (address.name) return address.name;
    const parts = [address.first_name, address.last_name].filter(Boolean);
    return parts.join(' ');
  };

  return (
    [fullCustomer.first_name, fullCustomer.last_name].filter(Boolean).join(' ') ||
    nameFromAddress(order.shipping_address) ||
    nameFromAddress(order.billing_address) ||
    fullCustomer.email ||
    order.email ||
    'Unknown'
  );
}

function extractCustomerPhoneFromFull(order: any, fullCustomer: any): string | null {
  const shippingAddress = order.shipping_address || {};
  const billingAddress = order.billing_address || {};
  
  return (
    fullCustomer.phone ||
    fullCustomer.default_address?.phone ||
    shippingAddress.phone ||
    billingAddress.phone ||
    order.phone ||
    null
  );
}

function extractCustomerEmailFromFull(order: any, fullCustomer: any): string | null {
  return fullCustomer.email || order.email || null;
}
