import type { Metadata } from "next";
import { Sora, Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { QueryProvider } from "@/lib/query/QueryProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const body = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const data = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
