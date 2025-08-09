import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SVD Quantum Image Compression - Tyrone Marhguy",
  description: "Interactive exploration of Singular Value Decomposition for image compression with real-time visualization and mathematical insights.",
  keywords: "SVD, image compression, linear algebra, mathematics, interactive, quantum, sci-fi, Tyrone Marhguy",
  authors: [{ name: "Tyrone Marhguy" }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: { url: '/favicon.svg', type: 'image/svg+xml' }
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/ghanaimage-svd-data.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} space-bg cyber-grid-bg`}>
        {/* Matrix Rain Effect */}
        <div className="matrix-rain"></div>
        
        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
