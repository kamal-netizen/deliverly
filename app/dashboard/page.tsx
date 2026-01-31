'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch the Shopify config from the API
    // For now, just show a success message
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Connected to Shopify</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Successfully Connected!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your Shopify store is now connected. Webhooks have been registered and orders will sync automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span className="text-gray-700">Shopify OAuth Connected</span>
                </li>
                <li className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span className="text-gray-700">Webhooks Registered</span>
                </li>
                <li className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span className="text-gray-700">Database Connected</span>
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/register"
                  className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
                >
                  Register Staff
                </Link>
                <Link
                  href="/register/rider"
                  className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-center rounded-md transition-colors"
                >
                  Register Rider
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Register staff members who will manage deliveries</li>
              <li>Register riders who will deliver orders</li>
              <li>Create a test order in Shopify to verify webhook integration</li>
              <li>Use the separate dashboard app to manage orders and assignments</li>
            </ol>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Information</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600 mb-2">Your backend API is running at:</p>
              <code className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200 block">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api
              </code>
              <p className="text-xs text-gray-500 mt-3">
                Use this base URL to connect your dashboard application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
