import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Set a new password for a rider.
 * POST /api/riders/:id/password  { password }
 *
 * Staff set the password directly rather than sending a reset email, because
 * that is how the account was created in the first place: a dispatcher adds a
 * rider and hands them credentials. Riders are not reliably reachable by email
 * on a work phone, and a reset link they cannot open is not a recovery path.
 *
 * Deliberately its own route rather than another field on PATCH. Changing
 * someone's password is a different kind of act from correcting their phone
 * number, and it should be legible as such in the route list and the logs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const password = body?.password;

    // Same floor as rider creation. Enforced here too, because the client is
    // not the thing that gets to decide.
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password of at least 8 characters required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // Confirm the id belongs to a rider before touching the auth user.
    //
    // riders.id is the auth user id, so without this check any staff member
    // could reset the password of *any* account - another staff member's, or
    // their own manager's - simply by passing that user's UUID. The route would
    // have no way to tell the difference. The riders table is what makes this
    // endpoint about riders.
    const { data: rider, error: lookupError } = await admin
      .from('riders')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const { error } = await admin.auth.admin.updateUserById(id, { password });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Could not set the password' },
        { status: 400 }
      );
    }

    console.info('Rider password reset for ' + id + ' by staff ' + auth.user.id);

    // The password is never echoed back, not even to the staff member who just
    // typed it. They have it; the response does not need to carry it anywhere.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error resetting rider password:', error);
    return NextResponse.json(
      { error: 'Could not reset the password' },
      { status: 500 }
    );
  }
}
