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
 * Register rider user
 * Creates both Supabase Auth user and rider database entry
 * POST /api/auth/register-rider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'rider'
      }
    });

    if (authError) {
      throw authError;
    }

    const userId = authData.user.id;

    // Create rider entry in database linked to auth user
    const { data: rider, error: riderError } = await supabaseAdmin
      .from('riders')
      .insert({
        id: userId, // Use auth user ID as rider ID for linkage
        name,
        email,
        phone: phone || null,
        active: true
      })
      .select()
      .single();

    if (riderError) {
      // Rollback: delete auth user if rider creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw riderError;
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata.name,
        role: 'rider'
      },
      rider
    }, { status: 201 });

    return withCors(response, request);

  } catch (error: any) {
    console.error('Rider registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Rider registration failed' },
      { status: 500 }
    );
  }
}
