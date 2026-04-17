import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import Providers from "@/components/shared/Providers";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils/cn";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cosmetic",
    template: "%s · Cosmetic",
  },
  description: "Elegant cosmetics, delivered.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(fraunces.variable, inter.variable)}>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-[var(--ink)] antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
