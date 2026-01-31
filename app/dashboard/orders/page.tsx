'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Order, OrderStatus } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/status-badge'
import { format } from 'date-fns'
import { Search, UserPlus, Package, Download, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ErrorBoundary } from '@/components/error-boundary'

function OrdersContent() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  const { data: ordersData = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => 
      apiClient.getOrders(statusFilter !== 'all' ? { status: statusFilter } : undefined),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Handle both array and object response formats
  const orders: Order[] = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.orders || []

  const filteredOrders = Array.isArray(orders) ? orders.filter((order: Order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }) : []

  const handleSyncOrders = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync/orders')
      const result = await response.json()
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Synced ${result.synced} orders, skipped ${result.skipped} duplicates`)
        refetch()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync orders')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track delivery orders</p>
        </div>
        <Button 
          onClick={handleSyncOrders} 
          disabled={syncing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Sync from Shopify
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-input rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="delivered">Delivered</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p>No orders found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Rider</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>{order.customer_name || '-'}</TableCell>
                  <TableCell>{order.customer_phone || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    {order.riders?.name || (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.created_at 
                      ? format(new Date(order.created_at), 'MMM d, yyyy')
                      : '-'
                    }
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <ErrorBoundary>
      <OrdersContent />
    </ErrorBoundary>
  )
}
