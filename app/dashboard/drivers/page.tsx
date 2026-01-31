'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drivers</h1>
        <p className="text-gray-500 mt-1">Manage your delivery drivers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">No drivers found</p>
            <p className="text-sm">Add drivers to start managing deliveries</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
