import "@fontsource-variable/vazirmatn";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { PWARegister } from "@/components/pwa/pwa-register";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Providers from "@/lib/providers";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "بازارا",
  title: {
    default: "بازارا | تحلیل بازار و سبد ترکیبی",
    template: "%s | بازارا",
  },
  description: "تحلیل داده‌محور بازار ایران، رمزارز و فارکس در یک تجربه یکپارچه",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "بازارا",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#07111f" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--nv-bg)] text-[var(--nv-text)] antialiased">
        <ThemeProvider>
          <Providers>
            <PWARegister />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
