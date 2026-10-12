"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Menu } from "lucide-react";
import { Lockup } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WorkspaceNavigation } from "./WorkspaceNavigation";
import { SidebarFooter } from "./SidebarFooter";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  return <header className="mobile-topbar">
    <Link href="/" aria-label="CarbonBox home"><Lockup /></Link>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation"><Menu aria-hidden="true" size={22} /></Button></SheetTrigger>
      <SheetContent onOpenAutoFocus={event => { event.preventDefault(); title.current?.focus(); }}><div className="mobile-drawer-body">
        <SheetHeader><SheetTitle ref={title} tabIndex={-1}>Workspace</SheetTitle><SheetDescription>Choose where to work</SheetDescription></SheetHeader>
        <div className="my-8"><WorkspaceNavigation onNavigate={() => setOpen(false)} /></div>
        <SidebarFooter />
      </div></SheetContent>
    </Sheet>
  </header>;
}
