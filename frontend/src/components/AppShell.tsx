"use client";

import { Suspense, type ReactNode } from "react";
import { DesktopSidebar } from "./navigation/DesktopSidebar";
import { MobileNavigation } from "./navigation/MobileNavigation";
import { useDesktop } from "./navigation/useDesktop";
import "@/styles/library.css";
import "@/styles/shell.css";
import "@/styles/pages.css";

export function AppShell({ children }: { children: ReactNode }) {
  const desktop = useDesktop();
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Suspense>{desktop ? <DesktopSidebar /> : <MobileNavigation />}</Suspense>
    <div className="workspace">
      <main id="main-content" tabIndex={-1} className="workspace-main">{children}</main>
      <footer className="workspace-footer">A clear record of your activity data.</footer>
    </div>
  </>;
}
