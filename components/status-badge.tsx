import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types'
import { closedBecause } from '@/lib/delivery'

// fulfilled is deliberately absent: status is the delivery lifecycle, and
// "fulfilled in Shopify" is shopify_fulfillment_id being set. See migration 008.
const statusConfig: Record<Exclude<OrderStatus, 'fulfilled'>, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  assigned: {
    label: 'Assigned',
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  delivered: {
    label: 'Delivered',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    className: 'bg-red-200 text-red-900 hover:bg-red-200',
  },
}

/**
 * The delivery status, unless something else finished the order first.
 *
 * An order fulfilled by another courier keeps `status = 'pending'` forever,
 * because nothing in this system ever happened to it. Showing that as "Pending"
 * is how a list of finished work came to look like a backlog. The extra fields
 * are optional so existing call sites that only have a status still work; they
 * simply cannot make that distinction.
 */
export function StatusBadge({
  status,
  shopifyFulfillmentId = null,
  closedAt = null,
}: {
  status: OrderStatus
  shopifyFulfillmentId?: number | null
  closedAt?: string | null
}) {
  const elsewhere = closedBecause({
    status,
    shopify_fulfillment_id: shopifyFulfillmentId,
    closed_at: closedAt,
  })

  if (elsewhere) {
    return (
      <Badge
        variant="secondary"
        className="bg-slate-100 text-slate-700 hover:bg-slate-100"
      >
        {elsewhere}
      </Badge>
    )
  }

  const config = statusConfig[status as Exclude<OrderStatus, 'fulfilled'>]

  // Handle invalid or undefined status
  if (!config) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        Unknown
      </Badge>
    )
  }
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
