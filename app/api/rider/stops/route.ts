import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get assigned orders for authenticated rider
 * GET /api/rider/stops
 */
export async function GET(request: NextRequest) {
  try {
    // Get rider ID from auth header (Supabase JWT)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user from Supabase auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const riderId = user.id;

    // Fetch assigned orders for this rider
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        delivery_events (
          event_type,
          created_at,
          notes
        )
      `)
      .eq('assigned_rider_id', riderId)
      .in('status', ['assigned', 'delivered'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching rider stops:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
