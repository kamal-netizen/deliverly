'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function ExtendedReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Extended Report</h1>
        <p className="text-gray-500 mt-1">Comprehensive overview providing detailed insights into all order-related metrics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Order Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="h-12 w-12 mb-4 opacity-50 mx-auto" />
              <p className="text-lg">Extended metrics</p>
              <p className="text-sm">Comprehensive order data will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
