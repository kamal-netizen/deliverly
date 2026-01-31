import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withCors, handleOptions } from '@/lib/cors';

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

/**
 * Get dashboard statistics
 * GET /api/stats
 */
export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Count orders by status for today
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .gte('created_at', todayISO);

    if (statusError) throw statusError;

    // Calculate stats
    const totalToday = statusCounts?.length || 0;
    const pending = statusCounts?.filter(o => o.status === 'pending').length || 0;
    const assigned = statusCounts?.filter(o => o.status === 'assigned').length || 0;
    const delivered = statusCounts?.filter(o => o.status === 'delivered').length || 0;
    const fulfilled = statusCounts?.filter(o => o.status === 'fulfilled').length || 0;

    // Get active riders count
    const { count: activeRiders, error: ridersError } = await supabaseAdmin
      .from('riders')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (ridersError) throw ridersError;

    // Get all-time totals
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const response = NextResponse.json({
      stats: {
        today: {
          total: totalToday,
          pending,
          assigned,
          delivered,
          fulfilled
        },
        riders: {
          active: activeRiders || 0
        },
        allTime: {
          totalOrders: totalOrders || 0
        }
      }
    }, { status: 200 });
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
