'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [shop, setShop] = useState('');
  const [error, setError] = useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate shop domain
    if (!shop) {
      setError('Please enter your shop domain');
      return;
    }

    // Add .myshopify.com if not included
    let shopDomain = shop.trim();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // Validate format
    if (!shopDomain.match(/^[a-z0-9-]+\.myshopify\.com$/)) {
      setError('Invalid shop domain. Use format: yourstore.myshopify.com');
      return;
    }

    // Redirect to Shopify OAuth
    window.location.href = `/api/auth/shopify?shop=${shopDomain}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Deliverly</h1>
          <p className="text-gray-600">Delivery Management System</p>
        </div>

        <div className="mt-8 space-y-6">
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-2">
                Connect Your Shopify Store
              </label>
              <input
                id="shop"
                type="text"
                placeholder="yourstore.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Connect to Shopify
            </button>
          </form>

          <div className="pt-6 border-t border-gray-200 space-y-3">
            <p className="text-sm text-gray-600 text-center">Quick Links</p>
            <div className="flex flex-col space-y-2">
              <Link
                href="/register"
                className="text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Register Staff
              </Link>
              <Link
                href="/register/rider"
                className="text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Register Rider
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
