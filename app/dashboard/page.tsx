'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { Order } from '@/types'

export default function DashboardPage() {
  const { data: ordersData = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.getOrders(),
    refetchInterval: 30000,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats(),
    refetchInterval: 30000,
  })

  // Handle both array and object response formats
  const orders: Order[] = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.orders || []
  const recentOrders: Order[] = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of delivery operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Orders Today
            </CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total orders created today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.pending || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting rider assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Assigned
            </CardTitle>
            <Truck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.assigned || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Out for delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Delivered
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.delivered || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/orders?status=pending">
            <Button variant="outline" className="w-full justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold">View Pending Orders</div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats?.today?.pending || 0} orders need assignment
                </div>
              </div>
            </Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button variant="outline" className="w-full justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold">All Orders</div>
                <div className="text-sm text-gray-500 mt-1">
                  View complete order list
                </div>
              </div>
            </Button>
          </Link>
          <Link href="/dashboard/riders">
            <Button variant="outline" className="w-full justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold">Manage Riders</div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats?.activeRiders || 0} active riders
                </div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: Order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{order.order_number}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.customer_name || 'Unknown Customer'} •{' '}
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
