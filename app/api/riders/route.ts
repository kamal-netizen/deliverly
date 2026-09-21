import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Get all riders
 * GET /api/riders
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { data: riders, error } = await getSupabaseAdmin()
      .from('riders')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ riders }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

/**
 * Create a new rider.
 * POST /api/riders
 *
 * Creates the Supabase Auth user and the riders row together, keyed on the same
 * id. The previous version inserted a random UUID with no auth user behind it,
 * producing a rider who could never log in and whose JWT could never match
 * assigned_rider_id.
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  let createdUserId: string | null = null;

  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password of at least 8 characters required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
      // app_metadata is service-role-writable only, so a rider cannot rewrite
      // their own role to 'staff'.
      app_metadata: { role: 'rider' },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Could not create rider account' },
        { status: 400 }
      );
    }

    createdUserId = authData.user.id;

    const { data: rider, error } = await admin
      .from('riders')
      .insert({
        id: createdUserId,
        name: name.trim(),
        email,
        phone: phone || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    createdUserId = null;
    return NextResponse.json({ rider }, { status: 201 });
  } catch (error: any) {
    // Roll back the auth user so a failed insert cannot strand an account that
    // has no rider row.
    if (createdUserId) {
      await getSupabaseAdmin().auth.admin.deleteUser(createdUserId).catch(() => {});
    }

    console.error('Error creating rider:', error);
    return NextResponse.json({ error: 'Failed to create rider' }, { status: 500 });
  }
}
