import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';

/**
 * Update rider (activate/deactivate or edit info)
 * PATCH /api/riders/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const admin = getSupabaseAdmin();

    // Only allow updating specific fields
    const allowedFields = ['name', 'phone', 'email', 'active'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      const response = NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
      return response;
    }

    if ('name' in updates) {
      if (typeof updates.name !== 'string' || !updates.name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = updates.name.trim();
    }

    if ('email' in updates) {
      const email = updates.email;

      if (typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
      }

      const trimmed = email.trim();

      // Only touch auth when the address has actually changed.
      //
      // The edit form posts every field, so saving an unrelated phone-number
      // correction would otherwise re-send the same address to the auth server.
      // Depending on the project's settings that starts an email-change
      // confirmation and mails the rider about something nobody changed.
      const { data: current } = await admin
        .from('riders')
        .select('email')
        .eq('id', id)
        .maybeSingle();

      if (current?.email === trimmed) {
        delete updates.email;
      } else {
        // The email is the rider's login. It lives in auth.users as well as in
        // this table, and this route only ever wrote the table - so changing it
        // produced a rider whose listed address no longer signed them in, with
        // nothing anywhere saying the two had diverged.
        //
        // Auth goes first deliberately. If it refuses - the address is already
        // taken, say - this table is left untouched rather than left
        // disagreeing with the thing that actually authenticates.
        const { error: authError } = await admin.auth.admin.updateUserById(id, {
          email: trimmed,
        });

        if (authError) {
          return NextResponse.json(
            { error: authError.message || 'Could not update the login email' },
            { status: 400 }
          );
        }

        updates.email = trimmed;
      }
    }

    // Dropping an unchanged email can leave nothing left to write. Saving a
    // form without altering anything is a successful no-op, not a bad request.
    if (Object.keys(updates).length === 0) {
      const { data: unchanged } = await admin
        .from('riders')
        .select()
        .eq('id', id)
        .maybeSingle();

      if (!unchanged) {
        return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
      }

      return NextResponse.json({ rider: unchanged }, { status: 200 });
    }

    const { data: rider, error } = await admin
      .from('riders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const response = NextResponse.json({ error: 'Rider not found' }, { status: 404 });
        return response;
      }
      throw error;
    }

    const response = NextResponse.json({ rider }, { status: 200 });
    return response;

  } catch (error: any) {
    console.error('Error updating rider:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return response;
  }
}

/**
 * Delete rider (soft delete - deactivate)
 * DELETE /api/riders/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    // Check if rider has any assigned orders
    const { data: orders, error: ordersError } = await getSupabaseAdmin()
      .from('orders')
      .select('id')
      .eq('assigned_rider_id', id)
      .in('status', ['assigned', 'pending'])
      // An order fulfilled elsewhere is not an active assignment; without this
      // it blocks deleting the rider forever.
      .is('shopify_fulfillment_id', null)
      .is('closed_at', null);

    if (ordersError) {
      throw ordersError;
    }

    if (orders && orders.length > 0) {
      const response = NextResponse.json(
        { error: 'Cannot delete rider with active assignments' },
        { status: 400 }
      );
      return response;
    }

    // Soft delete - deactivate the rider instead of deleting
    const { data: rider, error } = await getSupabaseAdmin()
      .from('riders')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const response = NextResponse.json({ error: 'Rider not found' }, { status: 404 });
        return response;
      }
      throw error;
    }

    const response = NextResponse.json(
      { success: true, message: 'Rider deactivated', rider },
      { status: 200 }
    );
    return response;

  } catch (error: any) {
    console.error('Error deleting rider:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return response;
  }
}
