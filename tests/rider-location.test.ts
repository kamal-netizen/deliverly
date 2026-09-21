import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * The rider location endpoint.
 *
 * The case worth pinning down is the third one: a rider whose `riders` row does
 * not exist. PostgREST treats an UPDATE matching no row as a success that
 * changed nothing, so the route used to answer {success:true} while writing
 * nothing at all. The rider app saw a 200, dispatch saw "never reported", and
 * neither end had any way to notice the disagreement.
 *
 * That is exactly the shape of bug a test is for, because it cannot be seen by
 * looking at either side on its own.
 */

// vi.mock is hoisted above the imports, so the state it closes over has to be
// hoisted too.
const state = vi.hoisted(() => ({
  auth: {
    ok: true as boolean,
    user: { id: 'rider-1', email: null, role: 'rider', via: 'bearer' },
    response: undefined as unknown,
  },
  update: {
    data: [{ id: 'rider-1' }] as { id: string }[] | null,
    error: null as unknown,
  },
  /** What the route actually wrote, so the payload can be asserted. */
  written: null as Record<string, unknown> | null,
}));

vi.mock('@/lib/auth', () => ({
  requireRider: async () => state.auth,
}));

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      update: (values: Record<string, unknown>) => {
        state.written = values;
        return {
          eq: () => ({
            select: () => Promise.resolve(state.update),
          }),
        };
      },
    }),
  }),
}));

const { POST } = await import('@/app/api/rider/location/route');

function post(body: unknown): NextRequest {
  return new NextRequest('https://deliverly.test/api/rider/location', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/rider/location', () => {
  beforeEach(() => {
    state.auth.ok = true;
    state.update.data = [{ id: 'rider-1' }];
    state.update.error = null;
    state.written = null;
  });

  it('records a valid position', async () => {
    const response = await POST(post({ latitude: 25.2048, longitude: 55.2708 }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });

    expect(state.written).toMatchObject({
      current_location: { latitude: 25.2048, longitude: 55.2708 },
      is_online: true,
    });
  });

  it('is 404, not a false success, when the rider has no row', async () => {
    // The regression this endpoint actually had: an update matching no row.
    state.update.data = [];

    const response = await POST(post({ latitude: 25.2048, longitude: 55.2708 }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: 'No rider record for this account',
    });
  });

  it('marks a rider offline when the app says so', async () => {
    const response = await POST(
      post({ latitude: 25.2048, longitude: 55.2708, isOnline: false })
    );

    expect(response.status).toBe(200);
    expect(state.written).toMatchObject({ is_online: false });
  });

  it('defaults to online when the app omits the flag', async () => {
    await POST(post({ latitude: 25.2048, longitude: 55.2708 }));

    expect(state.written).toMatchObject({ is_online: true });
  });

  it.each([
    ['latitude out of range', { latitude: 91, longitude: 0 }],
    ['longitude out of range', { latitude: 0, longitude: 181 }],
    ['latitude missing', { longitude: 0 }],
    ['a non-numeric latitude', { latitude: 'here', longitude: 0 }],
  ])('rejects %s', async (_label, body) => {
    const response = await POST(post(body));

    expect(response.status).toBe(400);
    // Nothing should reach the database once the coordinates are refused: the
    // shop domain of this endpoint is the pair of numbers.
    expect(state.written).toBeNull();
  });

  it('accepts the boundary coordinates rather than rounding them away', async () => {
    const response = await POST(post({ latitude: -90, longitude: 180 }));

    expect(response.status).toBe(200);
  });
});
