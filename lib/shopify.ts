import { getSupabaseAdmin } from './supabase-server';

interface ShopifyConfig {
  shop_domain: string;
  access_token: string;
}

/**
 * Get Shopify access token from database
 */
export async function getShopifyConfig(): Promise<ShopifyConfig | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('shopify_config')
    .select('shop_domain, access_token')
    .single();

  if (error) {
    console.error('Error fetching Shopify config:', error);
    return null;
  }

  return data;
}

/**
 * Shopify Admin API client
 */
export class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;
  private apiVersion: string = '2024-01';

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
  }

  private getBaseUrl(): string {
    return `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  async get(endpoint: string): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async post(endpoint: string, body: any): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

/**
 * Create Shopify API instance with stored credentials
 */
export async function createShopifyClient(): Promise<ShopifyAPI | null> {
  const config = await getShopifyConfig();
  
  if (!config) {
    return null;
  }

  return new ShopifyAPI(config.shop_domain, config.access_token);
}

/** Shopify shop domains are lowercase handles under myshopify.com. */
export const SHOP_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/** Cookie holding the OAuth state nonce between install steps. */
export const OAUTH_STATE_COOKIE = 'shopify_oauth_state';
