import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story Shelf",
  description: "Our bookshelf: scan, rate and find more books like the ones we love.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Story Shelf", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#22392F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Karla:wght@400;600;700&family=Young+Serif&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <div className="app">{children}</div>
        </AuthProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
