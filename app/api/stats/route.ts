import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Get dashboard statistics
 * GET /api/stats
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Count orders by status for today
    const { data: statusCounts, error: statusError } = await getSupabaseAdmin()
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
    const { count: activeRiders, error: ridersError } = await getSupabaseAdmin()
      .from('riders')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (ridersError) throw ridersError;

    // Get all-time totals
    const { count: totalOrders } = await getSupabaseAdmin()
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
    return response;

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return response;
  }
}
