import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { resolveRole } from '@/lib/auth';
import { supabaseEnv } from '@/lib/env';

/**
 * Login (staff or rider)
 * POST /api/auth/login
 *
 * Signs in server-side and sets the session cookies on the response, so the
 * browser never talks to the auth server directly.
 *
 * That is not only tidier, it is required here: the auth service is on a
 * different origin, and its CORS handler rejects any preflight carrying the
 * `apikey` header - which supabase-js sends on every call. A browser
 * signInWithPassword therefore fails before it is sent. Server to server there
 * is no preflight at all.
 *
 * Response shape is frozen: the Android rider app may depend on it. Add keys,
 * never rename or remove them. Cookies are additive and a native client
 * ignores them.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Collected here and applied to the response below, since the response
    // does not exist until the payload is known.
    const pendingCookies: {
      name: string;
      value: string;
      options?: CookieOptions;
    }[] = [];

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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Role comes from app_metadata, which only the service role can write. It
    // used to come from user_metadata and default to 'staff', so any user could
    // promote themselves with supabase.auth.updateUser().
    const userRole = await resolveRole(authData.user);

    if (!userRole) {
      return NextResponse.json(
        { error: 'Account has no assigned role. Contact an administrator.' },
        { status: 403 }
      );
    }

    let riderDetails = null;
    if (userRole === 'rider') {
      const { data: rider } = await getSupabaseAdmin()
        .from('riders')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      riderDetails = rider;
    }

    const { data: shopifyConfig } = await getSupabaseAdmin()
      .from('shopify_config')
      .select('shop_domain')
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name ?? null,
          role: userRole,
        },
        rider: riderDetails,
        session: authData.session,
        shopify: {
          connected: !!shopifyConfig,
          shopDomain: shopifyConfig?.shop_domain || null,
        },
      },
      { status: 200 }
    );

    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
