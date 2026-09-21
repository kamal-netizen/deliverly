import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Session refresh and page-level redirects.
 *
 * This is UX, not authorization. It deliberately does NOT match /api/* — the
 * authorization boundary is requireStaff()/requireRider() inside each route
 * handler, because middleware cannot express per-route roles and gating here
 * too would add a second round-trip to the auth server on every API call.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Shopify sends a merchant installing or opening the app to the App URL
  // with a signed query string and no code. Hand that to the install route,
  // which verifies the signature and starts OAuth. Checked before anything
  // else because this path needs no session and no Supabase client.
  if (pathname === '/' && searchParams.has('shop') && searchParams.has('hmac')) {
    const install = new URL('/api/auth/shopify/install', request.url);
    install.search = request.nextUrl.search;
    return NextResponse.redirect(install);
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without public env there is nothing to verify against. Fall through rather
  // than locking every page out; the route guards still deny API access.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() verifies the JWT with the auth server and refreshes it when
  // stale. getSession() would trust the cookie's contents unchecked.
  const {
    data: { user },
  } = await supabase.auth.getUser();


  if (!user && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
};
