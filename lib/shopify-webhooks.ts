import { ShopifyAPI } from './shopify';
import { webhookBaseUrl } from './env';

/**
 * The only webhook topics this app owns.
 *
 * orders/fulfilled is here because orders finished by anyone else were
 * invisible: with only create and cancelled subscribed, an order handed to
 * another courier and fulfilled in Shopify sat in the dispatch queue as
 * pending work until somebody noticed by hand.
 */
export const OUR_TOPICS = [
  'orders/create',
  'orders/cancelled',
  'orders/fulfilled',
] as const;

export type OurTopic = (typeof OUR_TOPICS)[number];

/**
 * Path fragment unique to this app's webhook endpoints.
 *
 * Ownership is decided on the path, not the host, so that a webhook left behind
 * by a previous tunnel or deployment URL is still recognised as ours and can be
 * repointed. Matching on host alone would strand them; matching on topic alone
 * would delete other apps' orders/create webhooks, which is exactly what the
 * old cleanup and disconnect routes did.
 */
const OUR_PATH_MARKER = '/api/webhooks/orders/';

export interface ShopifyWebhook {
  id: number;
  topic: string;
  address: string;
  created_at?: string;
}

export interface ReconcileResult {
  registered: ShopifyWebhook[];
  deleted: ShopifyWebhook[];
  kept: ShopifyWebhook[];
  failures: { topic: string; reason: string }[];
}

/** Address a topic's webhook should point at right now. */
export function addressFor(topic: OurTopic): string {
  // webhookBaseUrl() throws when neither WEBHOOK_URL nor NEXT_PUBLIC_APP_URL is
  // set. The old code read process.env.WEBHOOK_URL raw, so an unset value made
  // `address.startsWith(undefined)` compare against the string "undefined",
  // match nothing, and delete every webhook on the merchant's store.
  return `${webhookBaseUrl().replace(/\/+$/, '')}/api/webhooks/${topic}`;
}

/** Does this webhook belong to this app? */
export function isOurs(webhook: ShopifyWebhook): boolean {
  return (
    OUR_TOPICS.includes(webhook.topic as OurTopic) &&
    webhook.address.includes(OUR_PATH_MARKER)
  );
}

export async function listWebhooks(client: ShopifyAPI): Promise<ShopifyWebhook[]> {
  const data = await client.get<{ webhooks?: ShopifyWebhook[] }>('/webhooks.json');
  return data.webhooks ?? [];
}

/**
 * Make the store's webhooks match what this app expects.
 *
 * Only ever touches webhooks isOurs() accepts. Anything belonging to the
 * merchant or another app is counted in `kept` and left alone.
 */
export async function reconcileWebhooks(
  client: ShopifyAPI
): Promise<ReconcileResult> {
  const existing = await listWebhooks(client);

  const result: ReconcileResult = {
    registered: [],
    deleted: [],
    kept: [],
    failures: [],
  };

  const ours = existing.filter(isOurs);
  result.kept = existing.filter((w) => !isOurs(w));

  for (const topic of OUR_TOPICS) {
    const wanted = addressFor(topic);
    const forTopic = ours.filter((w) => w.topic === topic);

    // Correct and unique already: nothing to do.
    const correct = forTopic.filter((w) => w.address === wanted);
    const stale = forTopic.filter((w) => w.address !== wanted);

    // Duplicates of the correct address are still duplicates.
    const [keepFirst, ...duplicates] = correct;

    for (const webhook of [...stale, ...duplicates]) {
      try {
        await client.delete(`/webhooks/${webhook.id}.json`);
        result.deleted.push(webhook);
      } catch (error: any) {
        result.failures.push({
          topic,
          reason: `delete ${webhook.id}: ${error?.message ?? 'unknown error'}`,
        });
      }
    }

    if (keepFirst) {
      result.kept.push(keepFirst);
      continue;
    }

    try {
      const created = await client.post<{ webhook: ShopifyWebhook }>(
        '/webhooks.json',
        { webhook: { topic, address: wanted, format: 'json' } }
      );
      result.registered.push(created.webhook);
    } catch (error: any) {
      result.failures.push({
        topic,
        reason: `register: ${error?.message ?? 'unknown error'}`,
      });
    }
  }

  return result;
}

/**
 * Remove this app's webhooks on disconnect, and only this app's.
 *
 * The old disconnect route iterated every webhook on the store and deleted it,
 * destroying the merchant's own integrations along with other apps'.
 */
export async function deleteOurWebhooks(
  client: ShopifyAPI
): Promise<{ deleted: number; failed: number }> {
  const existing = await listWebhooks(client);

  let deleted = 0;
  let failed = 0;

  for (const webhook of existing.filter(isOurs)) {
    try {
      await client.delete(`/webhooks/${webhook.id}.json`);
      deleted++;
    } catch (error) {
      console.error(`Could not delete webhook ${webhook.id}:`, error);
      failed++;
    }
  }

  return { deleted, failed };
}
