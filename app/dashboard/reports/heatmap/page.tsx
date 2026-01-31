'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map } from 'lucide-react'

export default function HeatmapReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Heatmap Report</h1>
        <p className="text-gray-500 mt-1">Spatial order distribution on a map for quick trend visualization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Distribution Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Map className="h-12 w-12 mb-4 opacity-50 mx-auto" />
              <p className="text-lg">Heatmap View</p>
              <p className="text-sm">Order distribution map will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
