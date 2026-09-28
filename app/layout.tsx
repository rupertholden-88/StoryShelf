import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { RegisterSW } from "@/components/RegisterSW";
import { Splash } from "@/components/Splash";
import "./globals.css";

// iPhone launch screens: plain wall green so there's no white flash before the splash draws the logo.
const LAUNCH: [number, number, number][] = [
  [440, 956, 3], [430, 932, 3], [428, 926, 3], [420, 912, 3], [414, 896, 3], [414, 896, 2],
  [414, 736, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2],
];

export const metadata: Metadata = {
  title: "Story Shelf",
  description: "Our bookshelf: scan, rate and find more books like the ones we love.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "Story Shelf",
    statusBarStyle: "black-translucent",
    startupImage: LAUNCH.map(([w, h, r]) => ({
      url: `/launch/launch-${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
};

export const viewport: Viewport = {
  themeColor: "#22392F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Before first paint: no splash on reloads this session, and only a quick one if it already played today. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var d=document.documentElement.dataset;if(sessionStorage.getItem("nb-splash")==="1")d.splash="seen";else if(localStorage.getItem("nb-splash-day")===new Date().toDateString())d.splash="quick"}catch(e){}` }} />
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
          <Splash />
          <div className="app">{children}</div>
        </AuthProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
