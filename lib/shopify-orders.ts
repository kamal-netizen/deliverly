/**
 * Translating a Shopify order into an `orders` row.
 *
 * This replaces three near-copies of the same extraction logic (the orders
 * webhook, the sync route, and a debug route). They had already drifted: only
 * one of them fell back to `order.phone`, so the same customer got a phone
 * number or not depending on which path imported them.
 */

/** Columns sourced from Shopify. Local columns (tracking_code, assignment, */
/** delivery state) are deliberately absent so an update cannot clobber them. */
export interface ShopifyOrderRow {
  shopify_order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  shipping_address: unknown;
  line_items: unknown;
  total_price: number;
  subtotal_price: number;
  total_tax: number;
  total_discounts: number;
  currency: string;
  financial_status: string | null;
  fulfillment_status: string | null;
  payment_gateway_names: string[];
  tags: string[];
  note: string | null;
  order_url: string | null;
  shopify_fulfillment_id: number | null;
  fulfilled_at: string | null;
  created_at: string;
}

function nameFromAddress(address: any): string {
  if (!address) return '';
  if (address.name) return address.name;

  return [address.first_name, address.last_name].filter(Boolean).join(' ');
}

export function extractCustomerName(order: any): string {
  const customer = order?.customer ?? {};

  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
    nameFromAddress(order?.shipping_address) ||
    nameFromAddress(order?.billing_address) ||
    order?.email ||
    'Unknown'
  );
}

/** Full fallback chain, including the order-level phone the sync copy omitted. */
export function extractCustomerPhone(order: any): string | null {
  return (
    order?.customer?.phone ||
    order?.shipping_address?.phone ||
    order?.billing_address?.phone ||
    order?.phone ||
    null
  );
}

export function extractCustomerEmail(order: any): string | null {
  return order?.customer?.email || order?.email || null;
}

function toNumber(value: unknown): number {
  const parsed = parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags !== 'string' || !tags.trim()) return [];

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function mapShopifyOrderToRow(
  order: any,
  shopDomain: string | null
): ShopifyOrderRow {
  // Capture the existing fulfillment id when Shopify reports the order already
  // fulfilled. Without this an imported order sits with a null
  // shopify_fulfillment_id forever, and since that column is the fulfillment
  // idempotency key, the order stays eligible to be fulfilled a second time.
  const fulfillment = Array.isArray(order?.fulfillments)
    ? order.fulfillments.find((f: any) => f?.status !== 'cancelled') ?? null
    : null;

  return {
    shopify_order_id: order.id,
    order_number: order.name,
    customer_name: extractCustomerName(order),
    customer_phone: extractCustomerPhone(order),
    customer_email: extractCustomerEmail(order),
    shipping_address: order.shipping_address ?? null,
    line_items: order.line_items ?? null,
    total_price: toNumber(order.total_price),
    subtotal_price: toNumber(order.subtotal_price),
    total_tax: toNumber(order.total_tax),
    total_discounts: toNumber(order.total_discounts),
    currency: order.currency || 'AED',
    financial_status: order.financial_status ?? null,
    fulfillment_status: order.fulfillment_status ?? null,
    payment_gateway_names: order.payment_gateway_names ?? [],
    tags: parseTags(order.tags),
    note: order.note ?? null,
    order_url: shopDomain
      ? `https://${shopDomain}/admin/orders/${order.id}`
      : null,
    shopify_fulfillment_id: fulfillment?.id ?? null,
    fulfilled_at: fulfillment?.created_at ?? null,
    created_at: order.created_at,
  };
}

/**
 * Delivery status for a newly imported order.
 *
 * Only correct on insert. On update the local status reflects what a rider
 * actually did and must not be overwritten from Shopify.
 */
export function initialStatusFor(order: any): 'pending' | 'delivered' | 'cancelled' {
  if (order?.cancelled_at) return 'cancelled';
  if (order?.fulfillment_status === 'fulfilled') return 'delivered';

  return 'pending';
}
