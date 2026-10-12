import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import { QueryProvider } from "@/lib/query/QueryProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-sora",
  weight: "200 800",
  display: "swap",
});

const body = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-geist",
  weight: "200 800",
  display: "swap",
});

const data = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CarbonBox | Activity ledger",
  description: "Upload, process and review your emissions activity data.",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", display.variable, body.variable, data.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col"><QueryProvider><AppShell>{children}</AppShell></QueryProvider></body>
    </html>
  );
}
