/**
 * The authorization decision for every API route, in one place.
 *
 * This is the source of truth for the route-guard test: it iterates this list,
 * imports each handler, and asserts that guarded routes reject anonymous and
 * wrong-role callers. Adding a route without adding it here fails the test, and
 * adding it here with the wrong guard fails too.
 */

export type GuardKind = 'staff' | 'rider' | 'public' | 'public-hmac';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RouteGuardSpec {
  /** Route file path, relative to the repo root. */
  file: string;
  /** URL the route serves. */
  path: string;
  methods: HttpMethod[];
  guard: GuardKind;
  /** Required for anything not behind a role guard. */
  reason?: string;
}

export const ROUTE_GUARDS: RouteGuardSpec[] = [
  // --- staff ---
  { file: 'app/api/orders/route.ts', path: '/api/orders', methods: ['GET'], guard: 'staff' },
  { file: 'app/api/orders/[id]/route.ts', path: '/api/orders/[id]', methods: ['GET'], guard: 'staff' },
  { file: 'app/api/assignments/route.ts', path: '/api/assignments', methods: ['POST'], guard: 'staff' },
  { file: 'app/api/assignments/[id]/route.ts', path: '/api/assignments/[id]', methods: ['DELETE'], guard: 'staff' },
  { file: 'app/api/riders/route.ts', path: '/api/riders', methods: ['GET', 'POST'], guard: 'staff' },
  { file: 'app/api/riders/[id]/route.ts', path: '/api/riders/[id]', methods: ['PATCH', 'DELETE'], guard: 'staff' },
  { file: 'app/api/stats/route.ts', path: '/api/stats', methods: ['GET'], guard: 'staff' },
  { file: 'app/api/sync/orders/route.ts', path: '/api/sync/orders', methods: ['POST'], guard: 'staff' },
  { file: 'app/api/shopify/status/route.ts', path: '/api/shopify/status', methods: ['GET'], guard: 'staff' },
  { file: 'app/api/auth/shopify/route.ts', path: '/api/auth/shopify', methods: ['GET'], guard: 'staff' },
  { file: 'app/api/auth/shopify/disconnect/route.ts', path: '/api/auth/shopify/disconnect', methods: ['POST'], guard: 'staff' },
  { file: 'app/api/webhooks/status/route.ts', path: '/api/webhooks/status', methods: ['GET'], guard: 'staff' },
  { file: 'app/api/webhooks/reconcile/route.ts', path: '/api/webhooks/reconcile', methods: ['POST'], guard: 'staff' },

  // --- rider (Android app, Bearer) ---
  { file: 'app/api/rider/stops/route.ts', path: '/api/rider/stops', methods: ['GET'], guard: 'rider' },
  { file: 'app/api/rider/delivered/route.ts', path: '/api/rider/delivered', methods: ['POST'], guard: 'rider' },
  { file: 'app/api/rider/failed/route.ts', path: '/api/rider/failed', methods: ['POST'], guard: 'rider' },
  { file: 'app/api/rider/location/route.ts', path: '/api/rider/location', methods: ['POST'], guard: 'rider' },

  // --- public ---
  {
    file: 'app/api/auth/refresh/route.ts',
    path: '/api/auth/refresh',
    methods: ['POST'],
    guard: 'public',
    reason:
      'The refresh token is itself the credential; presenting a valid one is what proves the caller.',
  },
  {
    file: 'app/api/auth/logout/route.ts',
    path: '/api/auth/logout',
    methods: ['POST'],
    guard: 'public',
    reason:
      'Clears the session. Signing out an already-invalid session should succeed, not 401.',
  },
  {
    file: 'app/api/auth/login/route.ts',
    path: '/api/auth/login',
    methods: ['POST'],
    guard: 'public',
    reason: 'Issues the session. Rate limiting is the control here, not authentication.',
  },
  {
    file: 'app/api/track/[code]/route.ts',
    path: '/api/track/[code]',
    methods: ['GET'],
    guard: 'public',
    reason:
      'Customer-facing tracking. The unguessable nanoid tracking code is the credential; the response carries no customer name, email or phone.',
  },
  {
    file: 'app/api/auth/shopify/install/route.ts',
    path: '/api/auth/shopify/install',
    methods: ['GET'],
    guard: 'public-hmac',
    reason:
      'Shopify sends a merchant here to begin an install, before they have any Deliverly login. Authenticated by the query HMAC, which only Shopify can produce.',
  },
  {
    file: 'app/api/auth/shopify/callback/route.ts',
    path: '/api/auth/shopify/callback',
    methods: ['GET'],
    guard: 'public-hmac',
    reason: 'Shopify redirects the browser here. Verified by state nonce plus HMAC over the query string.',
  },
  {
    file: 'app/api/webhooks/orders/create/route.ts',
    path: '/api/webhooks/orders/create',
    methods: ['POST'],
    guard: 'public-hmac',
    reason: 'Called by Shopify, not a user. Verified by HMAC over the raw body.',
  },
  {
    file: 'app/api/webhooks/orders/cancelled/route.ts',
    path: '/api/webhooks/orders/cancelled',
    methods: ['POST'],
    guard: 'public-hmac',
    reason: 'Called by Shopify, not a user. Verified by HMAC over the raw body.',
  },
];
