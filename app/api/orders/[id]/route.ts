import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get single order with full details and event history
 * GET /api/orders/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        riders (
          id,
          name,
          phone,
          email
        ),
        delivery_events (
          id,
          event_type,
          proof_image_path,
          notes,
          latitude,
          longitude,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      throw error;
    }

    // Generate signed URLs for proof images
    if (order.delivery_events) {
      for (const event of order.delivery_events) {
        if (event.proof_image_path) {
          const { data: signedUrlData } = await supabaseAdmin.storage
            .from('delivery-proofs')
            .createSignedUrl(event.proof_image_path, 3600);

          event.proof_url = signedUrlData?.signedUrl || null;
        }
      }
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
