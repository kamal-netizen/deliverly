import crypto from 'crypto';

/**
 * Verify Shopify webhook HMAC signature
 * Must be called with raw request body before JSON parsing
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmacHeader)
    );
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}
