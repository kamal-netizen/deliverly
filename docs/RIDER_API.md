# Rider API

The contract the Android rider app builds against.

Base URL: `https://deliverly.srv1867587.hstgr.cloud`

All rider endpoints authenticate with `Authorization: Bearer <access_token>`.
CORS does not apply — a native client is not subject to it, which is why the
app talks to these endpoints directly rather than through a browser.

---

## Auth

### `POST /api/auth/login`

```json
{ "email": "rider@example.com", "password": "…" }
```

**200**

```json
{
  "success": true,
  "user": { "id": "uuid", "email": "…", "name": "…", "role": "rider" },
  "rider": { "id": "uuid", "name": "…", "phone": "…", "active": true },
  "session": { "access_token": "…", "refresh_token": "…", "expires_at": 1234567890 },
  "shopify": { "connected": true, "shopDomain": "…" }
}
```

**401** `{ "error": "Invalid email or password" }`
**403** `{ "error": "Account has no assigned role…" }` — the account exists but
is not a rider.

Store `refresh_token` in `EncryptedSharedPreferences`, not plain prefs.

### `POST /api/auth/refresh`

```json
{ "refresh_token": "…" }
```

**200** `{ "success": true, "session": { … } }`
**401** `{ "error": "Session expired" }` → sign in again; do not retry.

Access tokens last **one hour**. Refresh on `401` from any rider endpoint, then
retry the original request once. A shift is longer than a token.

---

## Work

### `GET /api/rider/stops`

**200** `{ "orders": [ … ] }`

Every order still `assigned`, plus those `delivered` in the last 24 hours.
Assigned first, then recent deliveries — the order a rider works through them.

Each order carries the full row: `id`, `order_number`, `customer_name`,
`customer_phone`, `shipping_address` (JSON), `line_items` (JSON), `total_price`,
`currency`, `status`, `tracking_code`, `delivered_at`, plus a nested
`delivery_events` array.

`shipping_address` is Shopify's shape — `address1`, `address2`, `city`,
`province`, `zip`, `country`, `latitude`, `longitude`. Latitude and longitude
are frequently **absent**; fall back to geocoding the formatted address, and
expect that to fail too. Do not assume a map pin is available.

---

## Completing a stop

Both endpoints are `multipart/form-data` and both are **safe to retry**.

### `clientEventId`

Generate a UUID on the device **before the first attempt** and reuse it for
every retry of that same submission. It is what makes the queue safe: without
it, a retry is indistinguishable from a second delivery.

A replay returns **200** with `"alreadyRecorded": true` and the original result.
Treat that as success and drop the item from the queue.

### `POST /api/rider/delivered`

| Field | Required | Notes |
|---|---|---|
| `orderId` | yes | |
| `clientEventId` | strongly recommended | UUID, stable across retries |
| `image` | no | proof photo; compress before sending |
| `latitude`, `longitude` | no | captured at the doorstep |
| `notes` | no | |

**200**

```json
{
  "success": true,
  "alreadyRecorded": false,
  "order": { "id": "…", "order_number": "#1234", "status": "delivered", "proof_url": "…" },
  "fulfillment": { "success": true, "fulfillmentId": 123 }
}
```

`fulfillment` reports the Shopify side separately. `success: false` there means
the delivery was recorded but Shopify was not updated — **not** a reason to
retry: the delivery is saved, and the failure is recorded on the order for
dispatch.

**400** already delivered / cancelled · **403** assigned to another rider ·
**404** unknown order

### `POST /api/rider/failed`

Same fields, plus `reason` (required), one of:

`customer_unavailable` · `address_not_found` · `customer_refused` ·
`access_denied` · `damaged` · `other`

The order returns to dispatch **unassigned**, with `delivery_attempts`
incremented. The rider has moved on; dispatch decides whether to reassign or
return it to the store. A photo matters as much here as on a delivery — it is
often what settles a dispute later.

**200**

```json
{
  "success": true,
  "order": { "id": "…", "order_number": "#1234", "status": "failed",
             "reason": "customer_unavailable", "delivery_attempts": 1 }
}
```

---

## Location

### `POST /api/rider/location`

```json
{ "latitude": 25.2048, "longitude": 55.2708, "isOnline": true }
```

**200** `{ "success": true, "recordedAt": "…" }`

Current position only — no trail is kept. Send `isOnline: false` when going off
shift.

Do not send this on every GPS fix. Something like every 30–60 seconds while
moving, and not at all while stationary or off shift: this runs on a phone in a
van for eight hours, and location is the fastest way to flatten a battery.

---

## Behaviour the app must get right

**Queue every submission.** Write it to a local database before the network
call, with its `clientEventId`. Drain the queue on connectivity. This is the
difference between a proof photo surviving a dead zone and vanishing.

**Refresh on 401, once.** Then retry the original request. A second 401 means
sign in again.

**Treat `alreadyRecorded: true` as success.** It means a previous attempt
landed.

**Never retry a 4xx other than 401.** 400, 403 and 404 are decisions, not
transient failures — retrying them just burns battery.

**Compress photos.** A modern phone camera produces 3–8 MB files. Riders are on
mobile data, often on a weak signal at a doorstep.
