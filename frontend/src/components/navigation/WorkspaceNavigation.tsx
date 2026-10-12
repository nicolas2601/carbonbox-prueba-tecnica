"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Files, Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const LINKS = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }, { href: "/uploads", label: "Uploads", icon: Files }, { href: "/uploads/new", label: "Upload a file", icon: Upload }];
export function WorkspaceNavigation({ onNavigate }: { onNavigate?(): void }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return <nav aria-label="Main navigation" className="workspace-nav">{LINKS.map(item => {
    const active = item.href === "/" ? pathname === "/" : item.href === "/uploads/new" ? pathname === item.href : pathname.startsWith("/uploads") && pathname !== "/uploads/new";
    return <Link key={item.href} href={item.href} className="workspace-link" aria-current={active ? "page" : undefined} onClick={onNavigate}>
      {active && <motion.span aria-hidden="true" className="active-pill" layoutId="workspace-active-pill" transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }} />}
      <item.icon aria-hidden="true" size={20} strokeWidth={1.75} /><span>{item.label}</span>
    </Link>;
  })}</nav>;
}
