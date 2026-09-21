import crypto from 'crypto';

/**
 * Constant-time comparison that tolerates differing lengths.
 *
 * crypto.timingSafeEqual throws when the buffers differ in size, so lengths are
 * compared first rather than letting the throw be swallowed.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify a Shopify webhook HMAC.
 *
 * Must be given the raw request body, before any JSON parsing: the signature is
 * over the exact bytes Shopify sent, and re-serialising changes them.
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  try {
    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return timingSafeEqual(digest, hmacHeader);
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Verify the HMAC Shopify attaches to browser redirects - the OAuth callback
 * and the app entry point.
 *
 * Only Shopify can produce this signature, because only Shopify and this app
 * know the API secret. That makes it sufficient authentication to begin an
 * install, which is why the install route does not also require a staff
 * session: the merchant arriving from Shopify has no Deliverly login yet.
 *
 * Parameters are sorted before signing, per Shopify's spec. They usually
 * arrive sorted already, so an implementation that skips this appears to work
 * until the day it does not.
 */
export function verifyShopifyQueryHmac(
  params: URLSearchParams,
  secret: string
): boolean {
  try {
    const provided = params.get('hmac');
    if (!provided) return false;

    const message = [...params.entries()]
      .filter(([key]) => key !== 'hmac' && key !== 'signature')
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const digest = crypto
      .createHmac('sha256', secret)
      .update(message, 'utf8')
      .digest('hex');

    return timingSafeEqual(digest, provided);
  } catch (error) {
    console.error('Query HMAC verification error:', error);
    return false;
  }
}
