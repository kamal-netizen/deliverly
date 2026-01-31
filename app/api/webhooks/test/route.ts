import { NextRequest, NextResponse } from 'next/server';

/**
 * Test webhook endpoint to verify webhooks can reach the server
 * GET /api/webhooks/test
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint is reachable',
    timestamp: new Date().toISOString()
  });
}

/**
 * POST test to simulate webhook
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({ 
    status: 'received',
    message: 'Webhook POST received successfully',
    timestamp: new Date().toISOString(),
    receivedData: body
  });
}
