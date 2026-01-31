import { ReactNode } from 'react'

export default function ShopifyLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}

export async function generateMetadata() {
  return {
    other: {
      'Content-Security-Policy': "frame-ancestors https://*.myshopify.com https://admin.shopify.com",
      'X-Frame-Options': 'ALLOW-FROM https://admin.shopify.com'
    }
  }
}
