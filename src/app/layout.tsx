import "@fontsource-variable/vazirmatn";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme/theme-provider";
import Providers from "@/lib/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "بازارا | تحلیل بازار و سبد ترکیبی",
  description: "تحلیل داده‌محور بازار ایران، رمزارز و فارکس در یک تجربه یکپارچه",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--nv-bg)] text-[var(--nv-text)] antialiased">
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
