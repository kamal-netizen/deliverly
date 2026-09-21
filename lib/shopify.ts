import { getSupabaseAdmin } from './supabase-server';
import { shopifyApiVersion } from './env';

/** Shopify shop domains are lowercase handles under myshopify.com. */
export const SHOP_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/** Cookie holding the OAuth state nonce between install steps. */
export const OAUTH_STATE_COOKIE = 'shopify_oauth_state';

export interface ShopifyConfig {
  id: string;
  shop_domain: string;
  access_token: string;
  notify_customer_on_fulfill: boolean | null;
  last_sync_at: string | null;
}

/**
 * The connected Shopify store, or null if none.
 *
 * One implementation replacing eight copies that used three different idioms.
 * The `.single()` variants threw on zero rows and on more than one, so a
 * second install made "is Shopify connected?" answer no while connected.
 * `limit(1).maybeSingle()` survives both.
 */
export async function getActiveShopifyConfig(): Promise<ShopifyConfig | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('shopify_config')
    .select('id, shop_domain, access_token, notify_customer_on_fulfill, last_sync_at')
    .order('installed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching Shopify config:', error);
    return null;
  }

  return data as ShopifyConfig | null;
}

/**
 * Record a successful sync against one config row.
 *
 * Replaces `.update(...).not('id', 'is', null)`, which matched every row.
 */
export async function markSynced(configId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('shopify_config')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', configId);

  if (error) {
    console.error('Could not update last_sync_at:', error);
  }
}

export class ShopifyApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Shopify API error: ${status}`);
    this.name = 'ShopifyApiError';
    this.status = status;
    this.body = body;
  }
}

interface PaginatedResult<T> {
  items: T[];
  /** Cursor for the next page, or null at the end. */
  nextPageInfo: string | null;
}

/**
 * Shopify Admin REST client.
 *
 * Previously only lib/fulfillment.ts used this; eight other files hand-rolled
 * fetch against a literal URL, which is how one of them drifted to a different
 * API version. Everything goes through here now, so the version is set once.
 */
export class ShopifyAPI {
  private readonly accessToken: string;
  private readonly shopDomain: string;
  private readonly apiVersion: string;

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.apiVersion = shopifyApiVersion();
  }

  private getBaseUrl(): string {
    return `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  /**
   * Single request with rate-limit handling.
   *
   * Shopify returns 429 with Retry-After under load. Without this, a sync of a
   * busy store fails partway and reports success for whatever it managed.
   */
  private async send(
    method: string,
    endpoint: string,
    body?: unknown,
    attempt = 0
  ): Promise<Response> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after')) || 2;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return this.send(method, endpoint, body, attempt + 1);
    }

    if (!response.ok) {
      throw new ShopifyApiError(response.status, await response.text());
    }

    return response;
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const response = await this.send('GET', endpoint);
    return response.json();
  }

  async post<T = any>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.send('POST', endpoint, body);
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    await this.send('DELETE', endpoint);
  }

  /**
   * One page of a cursor-paginated collection.
   *
   * Shopify caps `limit` at 250 and returns further pages via a `page_info`
   * cursor in the Link header. The old sync requested limit=250 and stopped,
   * silently importing only the most recent 250 orders.
   */
  async getPage<T = any>(
    endpoint: string,
    collection: string,
    pageInfo?: string | null
  ): Promise<PaginatedResult<T>> {
    // page_info cannot be combined with other filters, so when paging we send
    // it alone alongside limit.
    const url = pageInfo
      ? `${endpoint.split('?')[0]}?limit=250&page_info=${encodeURIComponent(pageInfo)}`
      : endpoint;

    const response = await this.send('GET', url);
    const payload = await response.json();

    return {
      items: (payload?.[collection] ?? []) as T[],
      nextPageInfo: parseNextPageInfo(response.headers.get('link')),
    };
  }
}

/**
 * Pull the `page_info` cursor for rel="next" out of a Link header.
 *
 * Shape: `<https://shop/admin/api/.../orders.json?page_info=XYZ>; rel="next"`
 */
export function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;

  for (const part of linkHeader.split(',')) {
    if (!part.includes('rel="next"')) continue;

    const match = part.match(/[?&]page_info=([^>&]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

/** Shopify client for the connected store, or null if none is connected. */
export async function createShopifyClient(): Promise<ShopifyAPI | null> {
  const config = await getActiveShopifyConfig();

  if (!config) {
    return null;
  }

  return new ShopifyAPI(config.shop_domain, config.access_token);
}
