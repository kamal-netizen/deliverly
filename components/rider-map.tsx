'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'

// Static, not dynamic: Next handles CSS imports in client components, and a
// dynamic import of a stylesheet has no type declarations to resolve.
import 'leaflet/dist/leaflet.css'

export interface RiderLocation {
  id: string
  name: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  lastUpdate: string | null
  ageMinutes: number | null
  live: boolean
  assignedOrders: number
}

/**
 * Rider positions on an OpenStreetMap base layer.
 *
 * Leaflet rather than Google Maps: no API key, no billing account, and no
 * per-load cost for a page that dispatch leaves open all day. The trade is
 * fewer features, none of which this screen needs.
 *
 * Leaflet is imported dynamically inside an effect because it touches `window`
 * at module scope, which throws during Next's server render.
 */
export function RiderMap({ riders }: { riders: RiderLocation[] }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const markers = useRef<Marker[]>([])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const L = (await import('leaflet')).default

      if (cancelled || !container.current) return

      if (!map.current) {
        // Dubai, as a starting view. Overridden below as soon as any rider has
        // reported a position.
        map.current = L.map(container.current).setView([25.2048, 55.2708], 11)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current)
      }

      markers.current.forEach((marker) => marker.remove())
      markers.current = []

      const located = riders.filter(
        (r) => r.latitude !== null && r.longitude !== null
      )

      located.forEach((rider) => {
        // A plain div marker rather than Leaflet's default pin: the default
        // loads images by a relative path that breaks under a bundler, and a
        // coloured dot carries the live/stale distinction better anyway.
        const colour = rider.live ? '#16a34a' : '#94a3b8'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
              width:18px;height:18px;border-radius:9999px;
              background:${colour};border:3px solid white;
              box-shadow:0 1px 4px rgba(0,0,0,.4);
            "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })

        const marker = L.marker([rider.latitude!, rider.longitude!], { icon })
          .addTo(map.current!)
          .bindPopup(
            `<strong>${escapeHtml(rider.name ?? 'Rider')}</strong><br/>` +
              `${rider.assignedOrders} assigned<br/>` +
              `<span style="color:#64748b">${describeAge(rider)}</span>`
          )

        markers.current.push(marker)
      })

      // Fit to whoever is actually out there, rather than leaving dispatch
      // looking at an arbitrary default view.
      if (located.length > 0) {
        const bounds = L.latLngBounds(
          located.map((r) => [r.latitude!, r.longitude!] as [number, number])
        )
        map.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [riders])

  useEffect(() => {
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  return (
    <div
      ref={container}
      className="h-[600px] w-full rounded-lg border"
      // Leaflet measures its container on init; without a height here the map
      // initialises at zero height and renders nothing at all.
      style={{ minHeight: 600 }}
    />
  )
}

function describeAge(rider: RiderLocation): string {
  if (rider.ageMinutes === null) return 'Never reported'
  if (rider.ageMinutes < 1) return 'Updated just now'
  if (rider.ageMinutes === 1) return 'Updated 1 minute ago'
  if (rider.ageMinutes < 60) return `Updated ${rider.ageMinutes} minutes ago`

  const hours = Math.round(rider.ageMinutes / 60)
  return hours === 1 ? 'Updated 1 hour ago' : `Updated ${hours} hours ago`
}

/** Rider names come from the database and land in a popup as raw HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
