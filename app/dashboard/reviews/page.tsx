'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-gray-500 mt-1">Customer feedback and ratings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Star className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">No reviews yet</p>
            <p className="text-sm">Customer reviews will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
