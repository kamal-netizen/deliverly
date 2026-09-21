import { createShopifyClient } from './shopify';
import { getSupabaseAdmin } from './supabase-server';

interface FulfillmentResult {
  success: boolean;
  alreadyFulfilled?: boolean;
  fulfillmentId?: number;
  error?: string;
}

/**
 * Fulfill a Shopify order using Fulfillment Orders API
 * This function is idempotent - safe to call multiple times
 */
export async function fulfillShopifyOrder(
  shopifyOrderId: number,
  notifyCustomer: boolean = true
): Promise<FulfillmentResult> {
  try {
    // 1. Check if already fulfilled (idempotency)
    const { data: order } = await getSupabaseAdmin()
      .from('orders')
      .select('shopify_fulfillment_id')
      .eq('shopify_order_id', shopifyOrderId)
      .single();

    if (order?.shopify_fulfillment_id) {
      return { 
        success: true, 
        alreadyFulfilled: true,
        fulfillmentId: order.shopify_fulfillment_id
      };
    }

    // 2. Create Shopify API client
    const shopify = await createShopifyClient();
    if (!shopify) {
      throw new Error('Shopify client not configured');
    }

    // 3. Fetch fulfillment orders for this order
    const response = await shopify.get(
      `/orders/${shopifyOrderId}/fulfillment_orders.json`
    );

    const fulfillmentOrders = response.fulfillment_orders;
    
    // Find an open fulfillment order
    const openFO = fulfillmentOrders.find(
      (fo: any) => fo.status === 'open' || fo.status === 'scheduled'
    );

    if (!openFO) {
      throw new Error('No open fulfillment order found');
    }

    // 4. Create fulfillment (all items in the fulfillment order)
    const fulfillmentResponse = await shopify.post('/fulfillments.json', {
      fulfillment: {
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: openFO.id
            // Omitting fulfillment_order_line_items fulfills ALL items
          }
        ],
        notify_customer: notifyCustomer
      }
    });

    const fulfillmentId = fulfillmentResponse.fulfillment.id;

    // 5. Update order in database
    await getSupabaseAdmin()
      .from('orders')
      .update({
        shopify_fulfillment_id: fulfillmentId,
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('shopify_order_id', shopifyOrderId);

    return { 
      success: true, 
      fulfillmentId 
    };

  } catch (error: any) {
    console.error('Fulfillment error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Fulfill specific line items (partial fulfillment)
 * Use this when only some items in an order should be fulfilled
 */
export async function fulfillPartialItems(
  shopifyOrderId: number,
  fulfillmentOrderId: number,
  lineItems: Array<{ id: number; quantity: number }>,
  notifyCustomer: boolean = true
): Promise<FulfillmentResult> {
  try {
    const shopify = await createShopifyClient();
    if (!shopify) {
      throw new Error('Shopify client not configured');
    }

    const fulfillmentResponse = await shopify.post('/fulfillments.json', {
      fulfillment: {
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: fulfillmentOrderId,
            fulfillment_order_line_items: lineItems
          }
        ],
        notify_customer: notifyCustomer
      }
    });

    const fulfillmentId = fulfillmentResponse.fulfillment.id;

    return { 
      success: true, 
      fulfillmentId 
    };

  } catch (error: any) {
    console.error('Partial fulfillment error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
