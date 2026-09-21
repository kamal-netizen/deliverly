/**
 * Centralized environment access.
 *
 * Everything here is lazy. No value is read at module scope, because reading
 * env at import time is exactly what broke `next build`: a route that merely
 * imported a module holding `process.env.X!` threw during page-data collection.
 *
 * NEXT_PUBLIC_* vars are referenced statically (`process.env.NEXT_PUBLIC_FOO`)
 * rather than through requireEnv(), because Next only inlines public vars into
 * the client bundle when it can see the literal member access. A dynamic lookup
 * would come back undefined in the browser.
 */

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`);
    this.name = 'MissingEnvError';
  }
}

const cache = new Map<string, string>();

/** Read a server-side env var, throwing if it is unset or empty. Memoized. */
export function requireEnv(name: string): string {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const value = process.env[name];
  if (!value) throw new MissingEnvError(name);

  cache.set(name, value);
  return value;
}

/** Read an optional env var, falling back to a default. */
export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function requirePublic(name: string, value: string | undefined): string {
  if (!value) throw new MissingEnvError(name);
  return value;
}

/** Supabase project URL and anon key. Safe on both server and client. */
export function supabaseEnv() {
  return {
    url: requirePublic(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    anonKey: requirePublic(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

/**
 * Service-role key. Bypasses RLS, so this is server-only — importing it into a
 * client component is a credential leak.
 */
export function supabaseServiceRoleKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Shopify OAuth and webhook credentials.
 *
 * `read_customers` is in the default scope set because the order webhook reads
 * `payload.customer` to derive the customer name and phone. Without it Shopify
 * omits those fields and every order imports as "Unknown".
 */
export function shopifyEnv() {
  return {
    apiKey: requireEnv('SHOPIFY_API_KEY'),
    apiSecret: requireEnv('SHOPIFY_API_SECRET'),
    // Shopify signs webhooks registered through the Admin API with the app's
    // client secret. A separate signing secret exists only for app-level
    // subscriptions declared in the Partner dashboard. Defaulting to the API
    // secret avoids the failure mode where every webhook 401s because the two
    // were assumed to be different values.
    webhookSecret: optionalEnv('SHOPIFY_WEBHOOK_SECRET', '') || requireEnv('SHOPIFY_API_SECRET'),
    scopes: optionalEnv(
      'SHOPIFY_SCOPES',
      'read_orders,write_orders,write_fulfillments,read_customers'
    ),
  };
}

/** Shopify Admin API version used for every call. */
export function shopifyApiVersion(): string {
  return optionalEnv('SHOPIFY_API_VERSION', '2025-07');
}

/** Public origin of this app, e.g. https://deliverly.example.com */
export function appUrl(): string {
  return requirePublic(
    'NEXT_PUBLIC_APP_URL',
    process.env.NEXT_PUBLIC_APP_URL
  );
}

/**
 * Base URL that Shopify webhooks are registered against. Falls back to the app
 * URL so it is never undefined — webhook reconciliation matches on this prefix,
 * and an undefined prefix previously matched nothing and deleted every webhook
 * on the merchant's store.
 */
export function webhookBaseUrl(): string {
  return optionalEnv('WEBHOOK_URL', '') || appUrl();
}

/** Where the OAuth callback sends the merchant once the install completes. */
export function dashboardUrl(): string {
  return optionalEnv('FRONTEND_DASHBOARD_URL', '') || appUrl();
}

/**
 * IANA timezone the merchant operates in. Dashboard "today" counts are bucketed
 * against this, not the server's clock, which is UTC on most hosts.
 */
export function merchantTimezone(): string {
  return optionalEnv('MERCHANT_TIMEZONE', 'Asia/Dubai');
}
