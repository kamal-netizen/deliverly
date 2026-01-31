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
 * Get all orders or filter by status
 * GET /api/orders?status=pending
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const riderId = searchParams.get('rider_id');

    let query = supabaseAdmin
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
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return withCors(response, request);
  }
}
