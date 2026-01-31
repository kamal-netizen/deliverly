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
 * Get all riders
 * GET /api/riders
 */
export async function GET(request: NextRequest) {
  try {
    const { data: riders, error } = await supabaseAdmin
      .from('riders')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    const response = NextResponse.json({ riders }, { status: 200 });
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Create new rider
 * POST /api/riders
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const { data: rider, error } = await supabaseAdmin
      .from('riders')
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response = NextResponse.json({ rider }, { status: 201 });
    return withCors(response, request);

  } catch (error: any) {
    console.error('Error creating rider:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
