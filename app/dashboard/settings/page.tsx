'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, CheckCircle, XCircle, Unlink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function SettingsPage() {
  const [shopifyConnected, setShopifyConnected] = useState(false)
  const [connectedShop, setConnectedShop] = useState('')
  const [newShopDomain, setNewShopDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    // Fetch Shopify connection status on load
    const fetchShopifyStatus = async () => {
      try {
        const response = await fetch('/api/shopify/status')
        
        if (response.ok) {
          const data = await response.json()
          setShopifyConnected(data.connected || false)
          setConnectedShop(data.shopDomain || '')
          setLastSync(data.lastSync || null)
        }
      } catch (error) {
        console.error('Failed to fetch Shopify status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShopifyStatus()

    // Refresh status every 30 seconds to keep lastSync current
    const intervalId = setInterval(fetchShopifyStatus, 30000)

    return () => clearInterval(intervalId)
  }, [])

  const handleConnectShopify = () => {
    const shopToConnect = newShopDomain || 'q1a5jq-35.myshopify.com'
    window.location.href = `/api/auth/shopify?shop=${shopToConnect}`
  }

  const handleDisconnectShopify = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify store? Orders will no longer sync automatically.')) {
      return
    }

    try {
      const response = await fetch('/api/auth/shopify/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      setShopifyConnected(false)
      setConnectedShop('')
      setNewShopDomain('')
      toast.success('Shopify store disconnected successfully')
    } catch (error) {
      toast.error('Failed to disconnect Shopify store')
      console.error(error)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your dashboard configuration</p>
      </div>

      {/* Shopify Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Shopify Integration</CardTitle>
          <CardDescription>
            Connect your Shopify store to sync orders automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {shopifyConnected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {shopifyConnected ? 'Connected' : 'Not Connected'}
                </p>
                {shopifyConnected && (
                  <p className="text-sm text-gray-500">{connectedShop}</p>
                )}
              </div>
            </div>
            {shopifyConnected ? (
              <Button onClick={handleDisconnectShopify} variant="destructive">
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnectShopify} disabled={!newShopDomain}>
                Connect Shopify
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {!shopifyConnected && (
            <div className="space-y-3">
              <Label htmlFor="shopDomain">Shopify Store Domain</Label>
              <Input
                id="shopDomain"
                placeholder="your-store.myshopify.com"
                value={newShopDomain}
                onChange={(e) => setNewShopDomain(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Enter your Shopify store domain to connect and sync orders
              </p>
            </div>
          )}

          {shopifyConnected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Webhook Status</span>
                <span className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Last Sync</span>
                <span className="text-sm text-gray-600">
                  {lastSync
                    ? formatDistanceToNow(new Date(lastSync), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your dashboard account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <p className="text-sm text-gray-600">Office Staff</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Access Level</label>
            <p className="text-sm text-gray-600">Full Access</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage how you receive notifications (Coming Soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-50">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive order updates via email</p>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-50">
              <div>
                <p className="text-sm font-medium">SMS Alerts</p>
                <p className="text-xs text-gray-500">Get urgent delivery alerts via SMS</p>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last Updated</span>
            <span className="font-medium">January 2026</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
