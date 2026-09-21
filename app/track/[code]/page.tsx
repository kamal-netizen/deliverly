import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { Package, CheckCircle2, Truck, Clock, XCircle } from 'lucide-react'
import { getTrackingInfo } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Track your delivery',
  // A tracking code is a credential. Keeping these out of search results stops
  // a shared or leaked link turning into an indexed page.
  robots: { index: false, follow: false },
}

const STEPS = [
  { key: 'pending', label: 'Order received', icon: Package },
  { key: 'assigned', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
] as const

function stepState(status: string, index: number): 'done' | 'current' | 'upcoming' {
  const order = ['pending', 'assigned', 'delivered']
  const position = order.indexOf(status)

  if (position === -1) return 'upcoming'
  if (index < position) return 'done'
  if (index === position) return 'current'
  return 'upcoming'
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const order = await getTrackingInfo(code)

  if (!order) notFound()

  const cancelled = order.status === 'cancelled'
  const failed = order.status === 'failed'

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Order</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed {format(new Date(order.created_at), 'd MMM yyyy')}
          </p>

          {cancelled || failed ? (
            <div className="mt-6 flex items-start gap-3 rounded-lg bg-red-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  {cancelled ? 'This order was cancelled' : 'Delivery was unsuccessful'}
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Please contact the store if you were expecting this order.
                </p>
              </div>
            </div>
          ) : (
            <ol className="mt-8 space-y-6">
              {STEPS.map((step, index) => {
                const state = stepState(order.status, index)
                const Icon = state === 'upcoming' ? Clock : step.icon

                return (
                  <li key={step.key} className="flex items-start gap-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        state === 'done'
                          ? 'bg-green-100 text-green-700'
                          : state === 'current'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="pt-1.5">
                      <p
                        className={
                          state === 'upcoming'
                            ? 'text-gray-400'
                            : 'font-medium text-gray-900'
                        }
                      >
                        {step.label}
                      </p>
                      {step.key === 'delivered' && order.delivered_at && (
                        <p className="mt-0.5 text-sm text-gray-500">
                          {format(new Date(order.delivered_at), 'd MMM yyyy, h:mm a')}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          {order.proof_url && (
            <div className="mt-8 border-t pt-6">
              <p className="mb-3 text-sm font-medium text-gray-900">
                Proof of delivery
              </p>
              {/* A time-limited signed URL from a private bucket, so next/image
                  optimisation would only cache something already expiring. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.proof_url}
                alt="Photo taken at delivery"
                className="w-full rounded-lg border"
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Keep this link private — anyone with it can see your delivery status.
        </p>
      </div>
    </main>
  )
}
