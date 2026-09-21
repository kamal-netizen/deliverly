import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Get all orders or filter by status
 * GET /api/orders?status=pending
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const riderId = searchParams.get('rider_id');

    let query = getSupabaseAdmin()
      .from('orders')
      .select(`
        *,
        riders (
          id,
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (riderId) {
      query = query.eq('assigned_rider_id', riderId);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    const response = NextResponse.json({ orders }, { status: 200 });
    return response;

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return response;
  }
}
