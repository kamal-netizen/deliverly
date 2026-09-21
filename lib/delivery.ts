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
