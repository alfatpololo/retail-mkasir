import type { Metadata } from "next";
import "./globals.css";
import { PrinterProvider } from "@/components/PrinterProvider";

export const metadata: Metadata = {
  title: "Retail POS System",
  description: "Modern Point of Sale System for Minimarket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50" suppressHydrationWarning>
        <PrinterProvider>{children}</PrinterProvider>
      </body>
    </html>
  );
}

