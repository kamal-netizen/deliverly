'use client'

import { useState, use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import { AssignRiderModal } from '@/components/assign-rider-modal'
import { format } from 'date-fns'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  UserPlus,
  ExternalLink,
  Image as ImageIcon,
  CreditCard,
  DollarSign,
  Tag,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Format an amount, or a dash when there is nothing sensible to show.
 *
 * line_items is typed `any` and comes straight from Shopify, so a missing
 * price is entirely possible - and parseFloat(undefined).toFixed(2) renders
 * the literal string "NaN" to the user.
 */
function money(value: unknown, currency: string | null | undefined): string {
  const amount = parseFloat(String(value ?? ''))

  if (!Number.isFinite(amount)) return '—'

  return `${currency || 'AED'} ${amount.toFixed(2)}`
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const router = useRouter()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.getOrder(id),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Link href="/dashboard/orders">
          <Button variant="link" className="mt-4">
            Back to Orders
          </Button>
        </Link>
      </div>
    )
  }

  const lineItems = Array.isArray(order.line_items) ? order.line_items : []
  const events = Array.isArray(order.delivery_events) ? order.delivery_events : []
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
          <p className="text-gray-500 mt-1">
            Created {order.created_at 
              ? format(new Date(order.created_at), 'MMM d, yyyy h:mm a')
              : 'Unknown'
            }
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{order.customer_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{order.customer_phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{order.customer_email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium">
                    {order.shipping_address?.address1 || '-'}
                    {order.shipping_address?.city && `, ${order.shipping_address.city}`}
                    {order.shipping_address?.zip && ` ${order.shipping_address.zip}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lineItems.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.title || item.name}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                        {item.sku && ` • SKU: ${item.sku}`}
                        {item.variant_title && ` • ${item.variant_title}`}
                      </p>
                    </div>
                    <p className="font-medium">
                      {money(item.price, order.currency)}
                    </p>
                  </div>
                ))}
                
                {/* Order Totals */}
                <div className="space-y-2 pt-3 border-t">
                  {order.subtotal_price != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{money(order.subtotal_price, order.currency)}</span>
                    </div>
                  )}
                  {order.total_discounts && parseFloat(String(order.total_discounts)) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discounts</span>
                      <span>-{money(order.total_discounts, order.currency)}</span>
                    </div>
                  )}
                  {order.total_tax && parseFloat(String(order.total_tax)) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span>{money(order.total_tax, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total</span>
                    <span>{money(order.total_price, order.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Fulfillment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment & Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <Badge variant={
                    order.financial_status === 'paid' ? 'default' : 
                    order.financial_status === 'pending' ? 'secondary' : 
                    'outline'
                  }>
                    {order.financial_status?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                  </Badge>
                </div>
              </div>
              
              {order.payment_gateway_names && order.payment_gateway_names.length > 0 && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">
                      {order.payment_gateway_names.join(', ')}
                      {order.payment_gateway_names.includes('Cash on Delivery (COD)') && 
                        <Badge variant="outline" className="ml-2">COD</Badge>
                      }
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Fulfillment Status</p>
                  <Badge variant={
                    order.fulfillment_status === 'fulfilled' ? 'default' : 
                    order.fulfillment_status === 'partial' ? 'secondary' : 
                    'outline'
                  }>
                    {order.fulfillment_status?.toUpperCase() || 'UNFULFILLED'}
                  </Badge>
                </div>
              </div>

              {order.note && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Order Note</p>
                    <p className="font-medium">{order.note}</p>
                  </div>
                </div>
              )}

              {order.tags && order.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {order.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {order.order_url && (
                <div className="pt-2 border-t">
                  <a
                    href={order.order_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View in Shopify Admin
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Delivery Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No delivery events yet
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedEvents.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        />
                        {index < sortedEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium capitalize">
                          {event.event_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {event.created_at
                            ? format(new Date(event.created_at), 'MMM d, yyyy h:mm a')
                            : 'Unknown time'
                          }
                        </p>
                        {event.notes && (
                          <p className="text-sm mt-1">{event.notes}</p>
                        )}
                        {event.proof_url && (
                          <div className="mt-2">
                            <a
                              href={event.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <ImageIcon className="h-4 w-4" />
                              View Proof of Delivery
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Rider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" />
                Assigned Rider
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.riders ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{order.riders.name}</p>
                  </div>
                  {order.riders.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{order.riders.phone}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setAssignModalOpen(true)}
                  >
                    Reassign Rider
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No rider assigned</p>
                  <Button
                    className="w-full"
                    onClick={() => setAssignModalOpen(true)}
                  >
                    Assign Rider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Tracking Code</p>
                <p className="font-medium font-mono">{order.tracking_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shopify Order ID</p>
                <p className="font-medium">{order.shopify_order_id}</p>
              </div>
              {order.delivered_at && (
                <div>
                  <p className="text-sm text-gray-500">Delivered At</p>
                  <p className="font-medium">
                    {format(new Date(order.delivered_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
              {order.fulfilled_at && (
                <div>
                  <p className="text-sm text-gray-500">Fulfilled At</p>
                  <p className="font-medium">
                    {format(new Date(order.fulfilled_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Rider Modal */}
      {assignModalOpen && (
        <AssignRiderModal
          orderId={order.id}
          currentRiderId={order.assigned_rider_id}
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
        />
      )}
    </div>
  )
}
