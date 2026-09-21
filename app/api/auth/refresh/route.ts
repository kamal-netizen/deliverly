import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnon } from '@/lib/supabase-server';

/**
 * Exchange a refresh token for a new session.
 * POST /api/auth/refresh  { refresh_token }
 *
 * Access tokens last an hour (GOTRUE_JWT_EXP=3600), so without this a rider
 * who signs in at the start of a shift is logged out an hour later, mid-round.
 *
 * It exists as our own endpoint so the rider app never needs the Supabase URL
 * or anon key. Shipping those in an APK means they are extractable by anyone
 * who downloads it, and rotating them then requires a store release.
 *
 * Unguarded by design: the refresh token is the credential. Presenting a valid
 * one is what proves the caller is who they say.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const refreshToken = body?.refresh_token;

    if (typeof refreshToken !== 'string' || !refreshToken) {
      return NextResponse.json({ error: 'refresh_token required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAnon().auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      // Expired, already used, or revoked. The app should treat this as
      // "sign in again" rather than retrying.
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    return NextResponse.json({ success: true, session: data.session }, { status: 200 });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Could not refresh session' }, { status: 500 });
  }
}
