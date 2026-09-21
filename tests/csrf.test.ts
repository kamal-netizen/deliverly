import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { csrfViolation } from '@/lib/auth';

/**
 * Regression tests for the origin check.
 *
 * The first version compared the Origin header against request.nextUrl.origin.
 * Behind a TLS-terminating proxy the browser sends https while the app sees
 * http internally, so every same-site mutation was rejected with a 403 - and
 * because the check logged nothing, it was invisible in the server logs.
 *
 * Tested directly rather than through requireStaff, which resolves the user
 * first: an unauthenticated request returns 401 and never reaches this code.
 */
function post(headers: Record<string, string>) {
  return new NextRequest('http://internal-host/api/sync/orders', {
    method: 'POST',
    headers,
  });
}

describe('csrfViolation', () => {
  it('allows a same-host request whose scheme differs from the internal one', () => {
    // The exact production case: https at the browser, http behind the proxy.
    const result = csrfViolation(
      post({
        'sec-fetch-site': 'same-origin',
        origin: 'https://app.test',
        'x-forwarded-host': 'app.test',
      }),
      'cookie'
    );

    expect(result).toBeNull();
  });

  it('blocks a cross-site request', () => {
    const result = csrfViolation(
      post({ 'sec-fetch-site': 'cross-site', origin: 'https://evil.test' }),
      'cookie'
    );

    expect(result?.status).toBe(403);
  });

  it('blocks an origin whose host is not ours', () => {
    const result = csrfViolation(
      post({ origin: 'https://evil.test', host: 'app.test' }),
      'cookie'
    );

    expect(result?.status).toBe(403);
  });

  it('blocks an unparseable origin', () => {
    const result = csrfViolation(post({ origin: 'not-a-url', host: 'app.test' }), 'cookie');

    expect(result?.status).toBe(403);
  });

  it('exempts bearer callers, which cannot be CSRFed', () => {
    // The Android app sends multipart with an Authorization header and no
    // Origin; enforcing this on it would break every delivery.
    expect(csrfViolation(post({ origin: 'https://evil.test' }), 'bearer')).toBeNull();
  });

  it('ignores safe methods', () => {
    const get = new NextRequest('http://internal-host/api/orders', {
      method: 'GET',
      headers: { origin: 'https://evil.test' },
    });

    expect(csrfViolation(get, 'cookie')).toBeNull();
  });
});
