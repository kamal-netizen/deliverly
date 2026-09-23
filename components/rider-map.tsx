'use client'

import { useEffect, useRef } from 'react'
import type { Map as MapLibreMap, Marker } from 'maplibre-gl'

// Static, not dynamic: Next handles CSS imports in client components, and a
// dynamic import of a stylesheet has no type declarations to resolve.
import 'maplibre-gl/dist/maplibre-gl.css'

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

/** Dubai, until a rider reports a position worth centring on. */
const DEFAULT_CENTRE: [number, number] = [55.2708, 25.2048]

/**
 * Free, keyless vector tiles from OpenFreeMap.
 *
 * Vector rather than raster is the whole point. A raster tile arrives as a
 * picture with the place names already painted into it, in whatever language
 * the renderer chose - which in the Gulf is Arabic, on every keyless service
 * going. Esri and CARTO were both tried; CARTO now demands an API key, and
 * Esri labels Dubai in Arabic until you zoom well in.
 *
 * Vector tiles arrive as data and are drawn in the browser, so the language is
 * ours to pick. See applyEnglishLabels.
 */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

/**
 * Rider positions on a map.
 *
 * MapLibre rather than Google Maps: no API key, no billing account, and so no
 * key to leak out of a public JavaScript bundle. The trade is fewer features,
 * none of which this screen needs - it draws a handful of dots.
 *
 * The library is imported inside an effect because it touches `window` at
 * module scope.
 */
export function RiderMap({ riders }: { riders: RiderLocation[] }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const markers = useRef<Marker[]>([])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // maplibre-gl is pinned to v4 on purpose.
      //
      // v6 ships ESM-only with its web worker as a separate module, and Next's
      // dev bundler does not emit that chunk: the worker request came back as
      // the app's own HTML and the map rendered an empty grey box with
      // "Worker failed to load" in the console. v4's UMD build inlines the
      // worker, so there is no second file to go missing.
      const maplibre = (await import('maplibre-gl')).default

      if (cancelled || !container.current) return

      if (!map.current) {
        const created = new maplibre.Map({
          container: container.current,
          style: STYLE_URL,
          // [longitude, latitude] - the opposite order to Leaflet, and to the
          // way the rest of this codebase carries coordinates. Swapped, Dubai
          // lands in the sea off Somalia rather than raising any error.
          center: DEFAULT_CENTRE,
          zoom: 10,
          // Dispatch reads this map; nobody needs to fly around it.
          pitchWithRotate: false,
          dragRotate: false,
        })

        created.addControl(new maplibre.NavigationControl({ showCompass: false }))

        // The style arrives asynchronously, and its layers do not exist until
        // it has. Relabelling before this fires silently does nothing.
        created.on('style.load', () => applyEnglishLabels(created))

        map.current = created
      }

      // Held locally from here: the null check above does not survive the
      // awaits, and TypeScript is right not to trust it across them.
      const instance = map.current

      markers.current.forEach((marker) => marker.remove())
      markers.current = []

      const located = riders.filter(
        (r) => r.latitude !== null && r.longitude !== null
      )

      located.forEach((rider) => {
        // A plain div rather than the default pin: a coloured dot carries the
        // live/stale distinction, which a pin cannot.
        const dot = document.createElement('div')
        dot.style.cssText = `
          width:18px;height:18px;border-radius:9999px;
          background:${rider.live ? '#16a34a' : '#94a3b8'};
          border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);
        `

        const popup = new maplibre.Popup({ offset: 14 }).setHTML(
          `<strong>${escapeHtml(rider.name ?? 'Rider')}</strong><br/>` +
            `${rider.assignedOrders} assigned<br/>` +
            `<span style="color:#64748b">${describeAge(rider)}</span>`
        )

        const marker = new maplibre.Marker({ element: dot })
          .setLngLat([rider.longitude!, rider.latitude!])
          .setPopup(popup)
          .addTo(instance)

        markers.current.push(marker)
      })

      // Fit to whoever is actually out there, rather than leaving dispatch
      // looking at an arbitrary default view.
      if (located.length > 0) {
        const bounds = new maplibre.LngLatBounds()

        located.forEach((r) => bounds.extend([r.longitude!, r.latitude!]))

        instance.fitBounds(bounds, {
          padding: 64,
          maxZoom: 14,
          // A single rider is the normal case here, and a bounds of one point
          // asks the map to zoom to infinity. Capping it keeps that sane.
          duration: 0,
        })
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
      className="h-[600px] w-full overflow-hidden rounded-lg border"
      // MapLibre measures its container on init; without a height here the map
      // initialises at zero height and renders nothing at all.
      style={{ minHeight: 600 }}
    />
  )
}

/**
 * Relabel the whole style in English.
 *
 * OpenStreetMap carries a place's name in several fields: `name` is whatever
 * is used locally, `name:en` the English one where somebody has added it, and
 * `name:latin` a transliteration. The style ships preferring the local name,
 * which is correct for a general map and wrong for a dispatcher in an office
 * reading Arabic street names they cannot pronounce down a phone.
 *
 * coalesce takes the first that exists, so a label is English where OSM has
 * English, transliterated where it does not, and local rather than blank in
 * the last resort. Nowhere ends up with no name at all.
 */
function applyEnglishLabels(map: MapLibreMap) {
  const layers = map.getStyle()?.layers ?? []

  for (const layer of layers) {
    if (layer.type !== 'symbol') continue

    // Symbol layers that draw only icons have no text to relabel, and setting
    // a text-field on them would invent labels the style never intended.
    if (map.getLayoutProperty(layer.id, 'text-field') === undefined) continue

    map.setLayoutProperty(layer.id, 'text-field', [
      'coalesce',
      ['get', 'name:en'],
      ['get', 'name:latin'],
      ['get', 'name'],
    ])
  }
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
