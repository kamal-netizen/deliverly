import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deliverly - Delivery Management",
  description: "Internal delivery management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
