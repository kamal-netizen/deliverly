import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase-server';
import { supabaseEnv } from './env';

export type Role = 'staff' | 'rider';

export interface AuthedUser {
  id: string;
  email: string | null;
  role: Role;
  /** How the caller proved identity. The Android rider app uses 'bearer'. */
  via: 'cookie' | 'bearer';
}

export type Guard =
  | { ok: true; user: AuthedUser }
  | { ok: false; response: NextResponse };

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Supabase client that reads the caller's session cookies.
 *
 * Verification only — setAll is a no-op because route handlers must not mutate
 * cookies mid-request. Token refresh and Set-Cookie belong to middleware.ts.
 */
function cookieClient(request: NextRequest) {
  const { url, anonKey } = supabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        /* no-op: middleware owns cookie refresh */
      },
    },
  });
}

/**
 * Resolve a user's role.
 *
 * Reads `app_metadata`, which only the service role can write. The role used to
 * live in `user_metadata`, which any user can rewrite themselves via
 * supabase.auth.updateUser() with the public anon key — so a rider could
 * promote themselves to staff.
 *
 * Falls back to a riders-table lookup so accounts created before the move still
 * work. Never defaults to 'staff': an unknown role is denied.
 */
export async function resolveRole(user: User): Promise<Role | null> {
  const claimed = user.app_metadata?.role;
  if (claimed === 'staff' || claimed === 'rider') return claimed;

  const { data } = await getSupabaseAdmin()
    .from('riders')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  return data ? 'rider' : null;
}

/**
 * Identify the caller, or null if unauthenticated.
 *
 * Bearer is tried first because that is the Android rider app's scheme; the
 * dashboard falls through to same-origin session cookies.
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthedUser | null> {
  const authHeader = request.headers.get('authorization');

  let user: User | null = null;
  let via: 'cookie' | 'bearer' = 'cookie';

  try {
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (!token) return null;

      const { data, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !data.user) return null;

      user = data.user;
      via = 'bearer';
    } else {
      // getUser(), never getSession(): getSession trusts the cookie's contents
      // without verifying the JWT against the auth server.
      const { data, error } = await cookieClient(request).auth.getUser();
      if (error || !data.user) return null;

      user = data.user;
      via = 'cookie';
    }
  } catch (error) {
    console.error('Auth resolution failed:', error);
    return null;
  }

  const role = await resolveRole(user);
  if (!role) return null;

  return { id: user.id, email: user.email ?? null, role, via };
}

/**
 * Reject cross-site state-changing requests.
 *
 * Cookies are sent automatically by the browser, so a cookie-authenticated
 * mutation needs an origin check. Bearer callers are exempt: an attacker's page
 * cannot set an Authorization header on a cross-site request.
 */
function csrfViolation(
  request: NextRequest,
  via: 'cookie' | 'bearer'
): NextResponse | null {
  if (via === 'bearer') return null;

  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;

  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') {
    return forbidden('Cross-site request blocked');
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return forbidden('Cross-origin request blocked');
  }

  return null;
}

async function requireRole(
  request: NextRequest,
  role: Role,
  enforceCsrf: boolean
): Promise<Guard> {
  const user = await getAuthUser(request);
  if (!user) return { ok: false, response: unauthorized() };

  if (user.role !== role) {
    return { ok: false, response: forbidden() };
  }

  if (enforceCsrf) {
    const violation = csrfViolation(request, user.via);
    if (violation) return { ok: false, response: violation };
  }

  return { ok: true, user };
}

/** Require an office-staff caller. Applies CSRF checks to cookie sessions. */
export function requireStaff(request: NextRequest): Promise<Guard> {
  return requireRole(request, 'staff', true);
}

/**
 * Require a rider caller.
 *
 * No CSRF enforcement: the Android app authenticates with Bearer, which is
 * inherently cross-site-safe, and sends multipart rather than JSON.
 */
export function requireRider(request: NextRequest): Promise<Guard> {
  return requireRole(request, 'rider', false);
}
