'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plug } from 'lucide-react'

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect with third-party services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Plug className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">No integrations configured</p>
            <p className="text-sm">Connect external services here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
