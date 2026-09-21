import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

/**
 * Three faces, each doing a job.
 *
 * Bricolage Grotesque for display: it has actual character, where the usual
 * choice reads as no choice at all. Inter Tight for body, tighter than stock
 * Inter so paragraphs sit denser. JetBrains Mono for figures, so order counts
 * and timestamps align in a column instead of dancing.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deliverly.srv1867587.hstgr.cloud"),
  title: {
    default: "Deliverly — delivery operations for Shopify stores",
    template: "%s · Deliverly",
  },
  description:
    "Sync Shopify orders, assign riders, capture proof of delivery, and fulfil back to Shopify automatically.",
  openGraph: {
    title: "Deliverly — delivery operations for Shopify stores",
    description:
      "Sync Shopify orders, assign riders, capture proof of delivery, and fulfil back to Shopify automatically.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="font-body antialiased">
        {/* Keyboard users should not have to tab through the whole nav. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
