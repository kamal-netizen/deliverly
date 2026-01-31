'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Order, Rider } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import { ErrorBoundary } from '@/components/error-boundary'
import { Package, User, Clock, MapPin, Phone, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function DispatchContent() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const queryClient = useQueryClient()

  // Fetch unassigned orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'unassigned'],
    queryFn: async () => {
      const allOrders = await apiClient.getOrders()
      return Array.isArray(allOrders) 
        ? allOrders.filter((order: Order) => order.status === 'pending')
        : []
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Fetch available riders
  const { data: riders = [], isLoading: ridersLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: () => apiClient.getRiders(),
    refetchInterval: 10000,
  })

  // Assign order mutation
  const assignMutation = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      return apiClient.assignRider(orderId, riderId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order assigned successfully!')
      setSelectedOrder(null)
    },
    onError: () => {
      toast.error('Failed to assign order')
    },
  })

  const handleAssign = (riderId: string) => {
    if (!selectedOrder) return
    assignMutation.mutate({ orderId: selectedOrder.id, riderId })
  }

  const unassignedCount = orders.length
  const availableRidersCount = riders.length

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedCount}</div>
            <p className="text-xs text-muted-foreground">Waiting for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Riders</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableRidersCount}</div>
            <p className="text-xs text-muted-foreground">Ready to deliver</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispatch Board */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Unassigned Orders Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No unassigned orders</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {orders.map((order: Order) => (
                  <div
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">#{order.order_number}</div>
                        <div className="text-sm text-gray-600">{order.customer_name}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{order.customer_address || 'No address'}</span>
                      </div>
                      {order.created_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Riders */}
        <Card>
          <CardHeader>
            <CardTitle>Available Riders</CardTitle>
          </CardHeader>
          <CardContent>
            {ridersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : riders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No available riders</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {riders.map((rider: Rider) => (
                  <div
                    key={rider.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold">{rider.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3" />
                          {rider.phone || 'No phone'}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Available
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAssign(rider.id)}
                      disabled={!selectedOrder || assignMutation.isPending}
                    >
                      {assignMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Assigning...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Assign Order
                        </div>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selection Indicator */}
      {selectedOrder && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-900">
                  Order #{selectedOrder.order_number} selected
                </div>
                <div className="text-sm text-blue-700">
                  Click on a rider above to assign this order
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DispatchPage() {
  return (
    <ErrorBoundary>
      <DispatchContent />
    </ErrorBoundary>
  )
}
