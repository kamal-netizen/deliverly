import type { NextConfig } from "next";

/**
 * These headers used to scope `frame-ancestors` to Shopify for a /shopify
 * route that served an embedded-app splash page. That page is gone, and the
 * accompanying `X-Frame-Options: ALLOWALL` was never a valid header value -
 * browsers ignore it, so the CSP was doing all the work anyway.
 *
 * Nothing here is meant to be framed, including the public tracking page.
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
