'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Clock, MapPin } from 'lucide-react'

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dispatch</h1>
        <p className="text-gray-500 mt-1">Real-time order dispatch and driver coordination</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Deliveries
            </CardTitle>
            <Truck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Currently in transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Assignments
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting driver</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Drivers
            </CardTitle>
            <MapPin className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Online and available</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispatch Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Truck className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">No active dispatches</p>
            <p className="text-sm">Orders will appear here for dispatch</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
