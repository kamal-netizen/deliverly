'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Users, TrendingUp, ExternalLink } from 'lucide-react'

export default function ShopifyEmbeddedPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeRiders: 0
  })

  useEffect(() => {
    // Fetch stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalOrders: data.today?.total || 0,
          pendingOrders: data.today?.pending || 0,
          activeRiders: data.activeRiders || 0
        })
      })
      .catch(console.error)
  }, [])

  const openDashboard = () => {
    window.open('/dashboard', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📦 Deliverly</h1>
          <p className="text-gray-600">Delivery Management System</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders Today</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRiders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Deliverly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your delivery management system is successfully connected to your Shopify store.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold">Quick Access:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Manage orders and assign riders</li>
                <li>Track delivery status in real-time</li>
                <li>View analytics and performance metrics</li>
                <li>Configure settings and preferences</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button onClick={openDashboard} size="lg" className="w-full">
                Open Full Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-500 pt-4 border-t">
              <p>Orders from your Shopify store will automatically sync to Deliverly.</p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View and manage all delivery orders synced from Shopify in one place.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚴 Rider Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Quickly assign delivery riders to orders and track their performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track delivery metrics, rider efficiency, and customer satisfaction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📸 Proof of Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Capture photos and signatures for complete delivery accountability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
