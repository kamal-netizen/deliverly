import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Deliverly - Delivery Management",
  description: "Internal delivery management system for Shopify stores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
