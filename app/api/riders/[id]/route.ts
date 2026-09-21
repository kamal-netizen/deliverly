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

    // Only allow updating specific fields
    const allowedFields = ['name', 'phone', 'email', 'active'];
    const updates: any = {};

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

    const { data: rider, error } = await getSupabaseAdmin()
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
      .in('status', ['assigned', 'pending']);

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
