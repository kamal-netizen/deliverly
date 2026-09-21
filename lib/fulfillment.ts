import { createShopifyClient, ShopifyAPI } from './shopify';
import { getSupabaseAdmin } from './supabase-server';

export interface FulfillmentResult {
  success: boolean;
  alreadyFulfilled?: boolean;
  fulfillmentId?: number;
  error?: string;
  /**
   * Shopify accepted the fulfillment but the id could not be written back.
   * The next attempt adopts it rather than creating a second one.
   */
  writeBackFailed?: boolean;
  /** Some fulfillment orders were fulfilled and others were not. */
  partial?: boolean;
}

interface FulfillmentOrder {
  id: number;
  status: string;
}

/**
 * Fulfill a Shopify order.
 *
 * Idempotent through three layers, in order of cost:
 *
 *   1. shopify_fulfillment_id already recorded locally - no API call at all.
 *   2. Shopify already has a fulfillment for this order - adopt its id.
 *   3. Otherwise create one.
 *
 * Layer 2 is what makes this safe. The previous version checked only the local
 * column and never verified the write-back succeeded, so a failed write after a
 * successful Shopify call left the order eligible to be fulfilled again. It
 * also meant an order fulfilled by hand in the Shopify admin threw
 * "No open fulfillment order found" forever.
 */
export async function fulfillShopifyOrder(
  shopifyOrderId: number,
  notifyCustomer: boolean = true
): Promise<FulfillmentResult> {
  const admin = getSupabaseAdmin();

  try {
    // Layer 1: local record.
    const { data: order } = await admin
      .from('orders')
      .select('shopify_fulfillment_id')
      .eq('shopify_order_id', shopifyOrderId)
      .maybeSingle();

    if (order?.shopify_fulfillment_id) {
      return {
        success: true,
        alreadyFulfilled: true,
        fulfillmentId: order.shopify_fulfillment_id,
      };
    }

    const shopify = await createShopifyClient();
    if (!shopify) {
      throw new Error('Shopify is not connected');
    }

    // Layer 2: adopt an existing fulfillment.
    const adopted = await findExistingFulfillment(shopify, shopifyOrderId);

    if (adopted) {
      const writeBackFailed = await recordFulfillment(shopifyOrderId, adopted);
      return {
        success: true,
        alreadyFulfilled: true,
        fulfillmentId: adopted,
        ...(writeBackFailed ? { writeBackFailed } : {}),
      };
    }

    // Layer 3: create one.
    const { fulfillment_orders: fulfillmentOrders } = await shopify.get<{
      fulfillment_orders: FulfillmentOrder[];
    }>(`/orders/${shopifyOrderId}/fulfillment_orders.json`);

    const open = (fulfillmentOrders ?? []).filter(
      (fo) => fo?.status === 'open' || fo?.status === 'scheduled'
    );

    if (open.length === 0) {
      throw new Error('No open fulfillment order found');
    }

    // Fulfill every open fulfillment order, not just the first. A multi-location
    // order has several; the old code took `.find()` and then reported complete
    // success, silently leaving the rest unfulfilled.
    const response = await shopify.post<{ fulfillment: { id: number } }>(
      '/fulfillments.json',
      {
        fulfillment: {
          line_items_by_fulfillment_order: open.map((fo) => ({
            fulfillment_order_id: fo.id,
            // Omitting the line items fulfills everything in that order.
          })),
          notify_customer: notifyCustomer,
        },
      }
    );

    const fulfillmentId = response?.fulfillment?.id;

    if (!fulfillmentId) {
      throw new Error('Shopify accepted the fulfillment but returned no id');
    }

    const writeBackFailed = await recordFulfillment(shopifyOrderId, fulfillmentId);

    return {
      success: true,
      fulfillmentId,
      ...(writeBackFailed ? { writeBackFailed } : {}),
      ...(open.length > 1 ? { partial: false } : {}),
    };
  } catch (error: any) {
    const message = error?.message ?? 'Fulfillment failed';
    console.error('Fulfillment error:', error);

    // Record the failure so a delivered-but-unfulfilled order is visible rather
    // than only present in the logs.
    await admin
      .from('orders')
      .update({
        fulfillment_error: message,
        fulfillment_attempted_at: new Date().toISOString(),
      })
      .eq('shopify_order_id', shopifyOrderId);

    return { success: false, error: message };
  }
}

/**
 * The id of an existing, non-cancelled fulfillment on this order.
 *
 * Covers orders fulfilled directly in the Shopify admin, and the case where a
 * previous run succeeded at Shopify but failed to write the id back.
 */
async function findExistingFulfillment(
  shopify: ShopifyAPI,
  shopifyOrderId: number
): Promise<number | null> {
  try {
    const { fulfillments } = await shopify.get<{
      fulfillments: { id: number; status: string }[];
    }>(`/orders/${shopifyOrderId}/fulfillments.json`);

    const live = (fulfillments ?? []).find((f) => f?.status !== 'cancelled');
    return live?.id ?? null;
  } catch (error) {
    // Not being able to check is not the same as there being none. Fall through
    // and let the create path decide; a duplicate attempt is rejected by
    // Shopify, whereas skipping would leave the order unfulfilled.
    console.error('Could not list existing fulfillments:', error);
    return null;
  }
}

/**
 * Persist the fulfillment id. Returns true if the write failed.
 *
 * Note this no longer touches `status`: status is the delivery lifecycle, and
 * "fulfilled in Shopify" is `shopify_fulfillment_id IS NOT NULL`.
 */
async function recordFulfillment(
  shopifyOrderId: number,
  fulfillmentId: number
): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from('orders')
    .update({
      shopify_fulfillment_id: fulfillmentId,
      fulfilled_at: new Date().toISOString(),
      fulfillment_status: 'fulfilled',
      fulfillment_error: null,
      fulfillment_attempted_at: new Date().toISOString(),
    })
    .eq('shopify_order_id', shopifyOrderId);

  if (error) {
    // Shopify is fulfilled but we did not record it. Loud, because the next
    // call has to adopt rather than create.
    console.error(
      `Fulfilled Shopify order ${shopifyOrderId} as ${fulfillmentId} but could not record it:`,
      error
    );
    return true;
  }

  return false;
}
