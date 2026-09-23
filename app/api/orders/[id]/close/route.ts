import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';
import { OPEN_STATUSES } from '@/lib/delivery';

/**
 * Close an order that was completed outside this system.
 * POST   /api/orders/:id/close   { reason? }
 * DELETE /api/orders/:id/close            - reopen it
 *
 * For the case no amount of syncing can reach: an order delivered by another
 * courier, or handed over at the counter, that nobody recorded in Shopify
 * either. Shopify does not know, so this system cannot be told - a person has
 * to say so.
 *
 * Deliberately not a status change. `status` is the delivery lifecycle, and
 * neither of its finished values is true here: 'delivered' would credit a
 * rider with a delivery they never made, corrupting their record and the day's
 * counts, and 'cancelled' would say the customer never received their order.
 * Closing is a third fact and gets its own column.
 *
 * DELETE undoes it, because the whole point is that a human is making a
 * judgement call from incomplete information, and they will sometimes be
 * wrong. A one-way door here would mean the only fix was the database.
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

    const reason =
      typeof body?.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 200)
        : 'Handled outside Deliverly';

    const admin = getSupabaseAdmin();

    const { data: order, error: lookupError } = await admin
      .from('orders')
      .select('id, status, closed_at, shopify_fulfillment_id, order_number')
      .eq('id', id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Closing something already finished would overwrite the real record of
    // how it finished with a vaguer one.
    if (!OPEN_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: `This order is already ${order.status}` },
        { status: 409 }
      );
    }

    const { data: updated, error } = await admin
      .from('orders')
      .update({
        closed_at: new Date().toISOString(),
        closed_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.info(
      'Order ' + (order.order_number ?? id) + ' closed as handled elsewhere by staff ' + auth.user.id
    );

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error closing order:', error);
    return NextResponse.json({ error: 'Could not close the order' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const { data: updated, error } = await admin_reopen(id);

    if (error) throw error;
    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.info('Order ' + id + ' reopened by staff ' + auth.user.id);

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error reopening order:', error);
    return NextResponse.json({ error: 'Could not reopen the order' }, { status: 500 });
  }
}

async function admin_reopen(id: string) {
  return getSupabaseAdmin()
    .from('orders')
    .update({ closed_at: null, closed_reason: null })
    .eq('id', id)
    .select()
    .maybeSingle();
}
