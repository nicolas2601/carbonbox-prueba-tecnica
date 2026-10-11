import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Navigation } from "./Navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="border-b border-line bg-surface">
      <div className="ledger-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="brand flex min-h-10 items-center gap-3" aria-label="CarbonBox home">
          <span aria-hidden="true" className="brand-mark">C</span>
          <span className="font-display text-[28px]">CarbonBox</span>
        </Link>
        <Suspense><Navigation /></Suspense>
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className="ledger-container min-w-0 flex-1 py-10">{children}</main>
    <footer className="ledger-container py-6 text-xs text-ink-muted">A clear record of your activity data.</footer>
  </>;
}
