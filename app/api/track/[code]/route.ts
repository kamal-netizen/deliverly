import { NextRequest, NextResponse } from 'next/server';
import { getTrackingInfo } from '@/lib/tracking';

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
    const order = await getTrackingInfo(code);

    if (!order) {
      return NextResponse.json({ error: 'Tracking code not found' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json({ error: 'Could not load tracking information' }, { status: 500 });
  }
}
