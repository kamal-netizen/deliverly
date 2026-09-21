import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseEnv } from '@/lib/env';

/**
 * Sign out and clear the session cookies.
 * POST /api/auth/logout
 *
 * Same-origin for the same reason as login: the auth server's CORS handler
 * rejects preflights carrying the `apikey` header that supabase-js sends.
 *
 * Deliberately unguarded - signing out an already-invalid session should
 * succeed, not 401.
 */
export async function POST(request: NextRequest) {
  const pendingCookies: {
    name: string;
    value: string;
    options?: CookieOptions;
  }[] = [];

  try {
    const { url, anonKey } = supabaseEnv();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
          pendingCookies.push(...cookies);
        },
      },
    });

    await supabase.auth.signOut();
  } catch (error) {
    // Clearing the cookies below still logs the browser out locally.
    console.error('Sign-out error:', error);
  }

  const response = NextResponse.json({ success: true }, { status: 200 });

  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
