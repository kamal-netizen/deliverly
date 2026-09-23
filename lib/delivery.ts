/**
 * Reasons a delivery can fail.
 *
 * Stored as free text and constrained here rather than by an enum: the set
 * changes with operations, and an enum makes every change a migration.
 */
export const FAILURE_REASONS = [
  'customer_unavailable',
  'address_not_found',
  'customer_refused',
  'access_denied',
  'damaged',
  'other',
] as const;

export type FailureReason = (typeof FAILURE_REASONS)[number];

export function isFailureReason(value: unknown): value is FailureReason {
  return typeof value === 'string' && FAILURE_REASONS.includes(value as FailureReason);
}

/**
 * How far back /api/rider/stops looks for completed work.
 *
 * Without a bound it returned every order a rider had ever touched, so the app
 * re-downloaded an entire career's deliveries on each poll, over mobile data.
 */
export const RIDER_STOPS_HISTORY_HOURS = 24;

/** Delivery-lifecycle states that still represent work for this system. */
export const OPEN_STATUSES = ['pending', 'assigned'] as const;

/** The shape any caller needs to decide whether an order is still ours to do. */
export interface OutstandingCheck {
  status?: string | null;
  shopify_fulfillment_id?: number | string | null;
  closed_at?: string | null;
}

/**
 * Whether an order is still outstanding work for dispatch.
 *
 * An open status is necessary but not sufficient, which is the whole bug this
 * exists to fix. `status` only ever advances when something happens *in this
 * system* - a rider delivers, a delivery fails, an order is cancelled. An order
 * fulfilled by another courier, or handed over at the counter, never reaches
 * any of those, so it stayed 'pending' indefinitely while the queue insisted it
 * was still to be delivered.
 *
 * Sync will not fix that on its own, and correctly so: it refuses to write
 * `status` from Shopify because doing that would resurrect genuinely delivered
 * orders as pending. So the fulfillment fact has to be read alongside the
 * status rather than folded into it.
 *
 * Three questions, all of which must say "still ours":
 *   - is the delivery lifecycle still open?
 *   - has anything at all fulfilled it in Shopify, ours or otherwise?
 *   - has someone closed it by hand as handled elsewhere?
 *
 * Keep this the single definition. The reason the queue, the stats and the
 * orders list disagreed with each other is that each decided for itself.
 */
export function isOutstanding(order: OutstandingCheck): boolean {
  if (!OPEN_STATUSES.includes(order.status as (typeof OPEN_STATUSES)[number])) {
    return false;
  }

  if (order.shopify_fulfillment_id != null) return false;
  if (order.closed_at != null) return false;

  return true;
}

/**
 * Why an order that is not outstanding left the queue, for the orders list.
 *
 * Returns null when the order is still outstanding, so callers can treat a
 * non-null result as "show this instead of the plain status badge".
 */
export function closedBecause(order: OutstandingCheck): string | null {
  if (isOutstanding(order)) return null;
  if (order.closed_at != null) return 'Handled elsewhere';
  if (order.shopify_fulfillment_id != null && OPEN_STATUSES.includes(
    order.status as (typeof OPEN_STATUSES)[number]
  )) {
    return 'Fulfilled elsewhere';
  }

  return null;
}
