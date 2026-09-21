import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Public order tracking by tracking code
 * GET /api/track/:code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const { data: order, error } = await getSupabaseAdmin()
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        created_at,
        delivered_at,
        delivery_events (
          event_type,
          proof_image_path,
          created_at,
          latitude,
          longitude
        )
      `)
      .eq('tracking_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tracking code not found' }, { status: 404 });
      }
      throw error;
    }

    // Generate signed URL for proof image if delivered
    const deliveredEvent = order.delivery_events?.find(
      (e: any) => e.event_type === 'delivered'
    );

    let proofUrl = null;
    if (deliveredEvent?.proof_image_path) {
      const { data: signedUrlData } = await getSupabaseAdmin().storage
        .from('delivery-proofs')
        .createSignedUrl(deliveredEvent.proof_image_path, 3600);

      proofUrl = signedUrlData?.signedUrl || null;
    }

    return NextResponse.json({
      order: {
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        delivered_at: order.delivered_at,
        proof_url: proofUrl,
        delivery_location: deliveredEvent
          ? {
              latitude: deliveredEvent.latitude,
              longitude: deliveredEvent.longitude
            }
          : null
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
