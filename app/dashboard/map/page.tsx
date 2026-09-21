'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryError } from '@/components/query-error'
import { apiClient } from '@/lib/api-client'
import type { RiderLocation } from '@/components/rider-map'
import { MapPin, Radio, WifiOff } from 'lucide-react'

// Leaflet touches `window` at module scope, so the map cannot be part of the
// server render at all.
const RiderMap = dynamic(
  () => import('@/components/rider-map').then((m) => m.RiderMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full animate-pulse rounded-lg border bg-gray-100" />
    ),
  }
)

export default function MapPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rider-locations'],
    queryFn: () => apiClient.getRiderLocations(),
    // Riders report about once a minute, so polling faster than that would only
    // re-fetch the same coordinates.
    refetchInterval: 30_000,
  })

  const riders: RiderLocation[] = data?.riders ?? []
  const live = riders.filter((r) => r.live)
  const located = riders.filter((r) => r.latitude !== null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live map</h1>
        <p className="text-sm text-gray-500">
          Rider positions, updated about once a minute while they are on shift.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Radio className="h-4 w-4 text-green-600" />} label="On shift now" value={live.length} />
        <Stat icon={<MapPin className="h-4 w-4 text-gray-500" />} label="With a position" value={located.length} />
        <Stat
          icon={<WifiOff className="h-4 w-4 text-gray-400" />}
          label="Never reported"
          value={data?.neverReported ?? 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where everyone is</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <QueryError error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="h-[600px] w-full animate-pulse rounded-lg border bg-gray-100" />
          ) : located.length === 0 ? (
            <div className="py-16 text-center">
              <WifiOff className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 font-medium">No positions yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Riders appear here once they start a shift in the rider app.
              </p>
            </div>
          ) : (
            <RiderMap riders={riders} />
          )}
        </CardContent>
      </Card>

      {riders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riders</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {riders.map((rider) => (
              <div key={rider.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      rider.live ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{rider.name ?? 'Rider'}</p>
                    <p className="text-xs text-gray-500">
                      {rider.assignedOrders} assigned ·{' '}
                      {rider.ageMinutes === null
                        ? 'never reported'
                        : rider.ageMinutes < 1
                          ? 'just now'
                          : `${rider.ageMinutes} min ago`}
                    </p>
                  </div>
                </div>

                {/* A rider can be marked online and still be stale: apps are
                    killed without getting to say goodbye. */}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    rider.live
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {rider.live ? 'On shift' : 'Offline'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
