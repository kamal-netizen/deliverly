import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv, supabaseServiceRoleKey } from './env';

let adminClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client for API routes.
 *
 * Constructed on first call rather than at module scope: building it eagerly
 * meant that importing any route without env vars threw during `next build`'s
 * page-data collection, which is what left this project unbuildable.
 *
 * This client bypasses RLS. Every route that uses it is responsible for its own
 * authorization — see lib/auth.ts.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const { url } = supabaseEnv();

  adminClient = createClient(url, supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

let anonClient: SupabaseClient | null = null;

/**
 * Anon-key Supabase client for server-side password sign-in.
 *
 * Sign-in does not need — and should not have — service-role privileges.
 */
export function getSupabaseAnon(): SupabaseClient {
  if (anonClient) return anonClient;

  const { url, anonKey } = supabaseEnv();

  anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return anonClient;
}
