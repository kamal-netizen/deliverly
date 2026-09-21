import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

let browserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon key), memoized so the whole tab shares one
 * GoTrue instance and one session subscription.
 *
 * Call this from an effect or an event handler, never from a component body:
 * client components are also rendered on the server during prerendering, where
 * there is no browser, no session, and possibly no public env vars.
 */
export const createClient = (): SupabaseClient => {
  if (browserClient) return browserClient;

  const { url, anonKey } = supabaseEnv();
  browserClient = createBrowserClient(url, anonKey);

  return browserClient;
};
