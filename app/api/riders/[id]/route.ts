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
 * Update rider (activate/deactivate or edit info)
 * PATCH /api/riders/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return withCors(response, request);
    }

    const { data: rider, error } = await supabaseAdmin
      .from('riders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const response = NextResponse.json({ error: 'Rider not found' }, { status: 404 });
        return withCors(response, request);
      }
      throw error;
    }

    const response = NextResponse.json({ rider }, { status: 200 });
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error updating rider:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return withCors(response, request);
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
  try {
    const { id } = await params;

    // Check if rider has any assigned orders
    const { data: orders, error: ordersError } = await supabaseAdmin
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
      return withCors(response, request);
    }

    // Soft delete - deactivate the rider instead of deleting
    const { data: rider, error } = await supabaseAdmin
      .from('riders')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const response = NextResponse.json({ error: 'Rider not found' }, { status: 404 });
        return withCors(response, request);
      }
      throw error;
    }

    const response = NextResponse.json(
      { success: true, message: 'Rider deactivated', rider },
      { status: 200 }
    );
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error deleting rider:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return withCors(response, request);
  }
}
