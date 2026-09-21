import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseAnon } from '@/lib/supabase-server';
import { resolveRole } from '@/lib/auth';

/**
 * Login user (staff or rider)
 * Returns user info with role
 * POST /api/auth/login
 *
 * Response shape is frozen: the Android rider app may depend on it. Add keys,
 * never rename or remove them.
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

    // Anon client, not service role: signing in needs no elevated privilege.
    const { data: authData, error: authError } =
      await getSupabaseAnon().auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Read the role from app_metadata (service-role-writable only). It used to
    // come from user_metadata and default to 'staff', which meant any user
    // could promote themselves with supabase.auth.updateUser().
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

    return NextResponse.json(
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
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
