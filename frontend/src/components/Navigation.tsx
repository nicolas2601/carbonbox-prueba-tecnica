"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="flex gap-2">
    <Link className="nav-link" href="/" aria-current={pathname === "/" ? "page" : undefined}>Dashboard</Link>
    <Link className="nav-link" href="/uploads" aria-current={pathname.startsWith("/uploads") ? "page" : undefined}>Uploads</Link>
  </nav>;
}
