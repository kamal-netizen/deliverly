'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map } from 'lucide-react'

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Map</h1>
        <p className="text-gray-500 mt-1">Track deliveries in real-time</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[500px] bg-gray-100 rounded-lg text-gray-500">
            <Map className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">Map view</p>
            <p className="text-sm">Real-time driver locations will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
