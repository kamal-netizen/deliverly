import { getSupabaseAdmin } from './supabase-server';

export interface TrackingInfo {
  order_number: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  proof_url: string | null;
  delivery_location: { latitude: number | null; longitude: number | null } | null;
}

/**
 * Public tracking lookup, shared by the API route and the tracking page.
 *
 * Deliberately returns no customer name, email, phone or address. The tracking
 * code is the only credential, and anyone who has a link should learn the state
 * of the delivery, not who it is for.
 */
export async function getTrackingInfo(code: string): Promise<TrackingInfo | null> {
  const admin = getSupabaseAdmin();

  const { data: order, error } = await admin
    .from('orders')
    .select(
      `
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
    `
    )
    .eq('tracking_code', code)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const delivered = (order.delivery_events as any[])?.find(
    (event) => event.event_type === 'delivered'
  );

  let proofUrl: string | null = null;

  if (delivered?.proof_image_path) {
    const { data: signed } = await admin.storage
      .from('delivery-proofs')
      .createSignedUrl(delivered.proof_image_path, 3600);

    proofUrl = signed?.signedUrl ?? null;
  }

  return {
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
    delivered_at: order.delivered_at,
    proof_url: proofUrl,
    delivery_location: delivered
      ? { latitude: delivered.latitude, longitude: delivered.longitude }
      : null,
  };
}
