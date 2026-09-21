import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';
import { createShopifyClient, getActiveShopifyConfig, markSynced } from '@/lib/shopify';
import { mapShopifyOrderToRow, initialStatusFor } from '@/lib/shopify-orders';
import { nanoid } from 'nanoid';
import { syncInitialDays } from '@/lib/env';

/** Pages of 250. A cap so one request cannot run unbounded. */
const MAX_PAGES = 20;

/** Parallelism for per-order updates. */
const UPDATE_CONCURRENCY = 10;

export const maxDuration = 60;

/**
 * Pull orders from Shopify into the local database.
 * POST /api/sync/orders            incremental, since the last successful sync
 * POST /api/sync/orders?full=true  everything
 *
 * This was a GET that performed a 250-order mass write, so a link prefetch or a
 * crawler could trigger it.
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const config = await getActiveShopifyConfig();
    const shopify = await createShopifyClient();

    if (!config || !shopify) {
      return NextResponse.json({ error: 'Shopify not connected' }, { status: 400 });
    }

    const full = request.nextUrl.searchParams.get('full') === 'true';

    // Incremental by default. The old version always requested the most recent
    // 250 orders and never paged, so a store with more than that silently never
    // imported the rest.
    const params = new URLSearchParams({ status: 'any', limit: '250' });

    if (!full) {
      if (config.last_sync_at) {
        params.set('updated_at_min', config.last_sync_at);
      } else {
        // First run. Without a floor this would try to pull the store's
        // entire history - 13k+ orders on an established shop - which no
        // single request can finish. ?full=true is the deliberate backfill.
        const since = new Date();
        since.setDate(since.getDate() - syncInitialDays());
        params.set('created_at_min', since.toISOString());
      }
    }

    let pageInfo: string | null = null;
    let pages = 0;
    let fetched = 0;
    let inserted = 0;
    let updated = 0;
    const failures: { shopifyOrderId: number; reason: string }[] = [];

    do {
      const page: { items: any[]; nextPageInfo: string | null } = await shopify.getPage<any>(
        `/orders.json?${params.toString()}`,
        'orders',
        pageInfo
      );

      pages++;
      fetched += page.items.length;

      if (page.items.length > 0) {
        const outcome = await syncChunk(page.items, config.shop_domain);
        inserted += outcome.inserted;
        updated += outcome.updated;
        failures.push(...outcome.failures);
      }

      pageInfo = page.nextPageInfo;
    } while (pageInfo && pages < MAX_PAGES);

    const truncated = Boolean(pageInfo);

    // Advance the watermark only on a run that both completed and wrote
    // everything. Moving it after a truncated run would skip every order
    // beyond the page cap permanently.
    if (failures.length === 0 && !truncated) {
      await markSynced(config.id);
    }

    return NextResponse.json({
      success: failures.length === 0,
      mode: full ? 'full' : 'incremental',
      pages,
      fetched,
      inserted,
      updated,
      failed: failures.length,
      failures: failures.slice(0, 10),
      truncated,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    // Never return error.stack: this used to hand the caller a stack trace.
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

/**
 * Write one page of Shopify orders.
 *
 * Partition with a single query, then bulk-insert the new ones. The previous
 * version ran an existence probe plus a write per order - roughly 500 serial
 * round-trips for a full page, which timed out on any real store and raced the
 * orders/create webhook into duplicate rows.
 */
async function syncChunk(orders: any[], shopDomain: string) {
  const admin = getSupabaseAdmin();

  const ids = orders.map((o) => o.id);

  const { data: existingRows, error: lookupError } = await admin
    .from('orders')
    .select('shopify_order_id')
    .in('shopify_order_id', ids);

  if (lookupError) throw lookupError;

  const existing = new Set((existingRows ?? []).map((r) => r.shopify_order_id));

  const toInsert = orders.filter((o) => !existing.has(o.id));
  const toUpdate = orders.filter((o) => existing.has(o.id));

  const failures: { shopifyOrderId: number; reason: string }[] = [];
  let inserted = 0;

  if (toInsert.length > 0) {
    const rows = toInsert.map((order) => ({
      ...mapShopifyOrderToRow(order, shopDomain),
      tracking_code: nanoid(10),
      status: initialStatusFor(order),
    }));

    // Ignore duplicates rather than failing the batch: the orders/create
    // webhook may have inserted one of these between the lookup and now.
    const { data, error } = await admin
      .from('orders')
      .upsert(rows, { onConflict: 'shopify_order_id', ignoreDuplicates: true })
      .select('shopify_order_id');

    if (error) {
      failures.push(
        ...toInsert.map((o) => ({ shopifyOrderId: o.id, reason: error.message }))
      );
    } else {
      inserted = data?.length ?? 0;
    }
  }

  // Updates carry only Shopify-sourced columns. tracking_code and status are
  // local facts - status reflects what a rider actually did, and overwriting it
  // from Shopify would resurrect delivered orders as pending.
  let updated = 0;

  for (let i = 0; i < toUpdate.length; i += UPDATE_CONCURRENCY) {
    const batch = toUpdate.slice(i, i + UPDATE_CONCURRENCY);

    const results = await Promise.all(
      batch.map(async (order) => {
        const { error } = await admin
          .from('orders')
          .update(mapShopifyOrderToRow(order, shopDomain))
          .eq('shopify_order_id', order.id);

        return { id: order.id, error };
      })
    );

    for (const result of results) {
      if (result.error) {
        failures.push({ shopifyOrderId: result.id, reason: result.error.message });
      } else {
        updated++;
      }
    }
  }

  return { inserted, updated, failures };
}
