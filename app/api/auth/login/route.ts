import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { withCors, handleOptions } from '@/lib/cors';

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

/**
 * Login user (staff or rider)
 * Returns user info with role
 * POST /api/auth/login
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

    // Sign in user using Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const userRole = authData.user.user_metadata?.role || 'staff';

    // If rider, fetch rider details
    let riderDetails = null;
    if (userRole === 'rider') {
      const { data: rider } = await supabaseAdmin
        .from('riders')
        .select('*')
        .eq('id', userId)
        .single();
      
      riderDetails = rider;
    }

    // Get Shopify connection status
    const { data: shopifyConfig } = await supabaseAdmin
      .from('shopify_config')
      .select('shop_domain')
      .single();

    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata.name,
        role: userRole
      },
      rider: riderDetails,
      session: authData.session,
      shopify: {
        connected: !!shopifyConfig,
        shopDomain: shopifyConfig?.shop_domain || null
      }
    }, { status: 200 });

    return withCors(response, request);

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
