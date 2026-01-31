import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
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
  fulfilled: {
    label: 'Fulfilled',
    variant: 'default',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
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

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
