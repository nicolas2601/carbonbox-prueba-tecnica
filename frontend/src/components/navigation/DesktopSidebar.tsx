import Link from "next/link";
import { Lockup } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { WorkspaceNavigation } from "./WorkspaceNavigation";
import { SidebarFooter } from "./SidebarFooter";

export function DesktopSidebar() {
  return <aside className="desktop-sidebar">
    <Link href="/" aria-label="CarbonBox home" className="sidebar-brand"><Lockup /></Link>
    <p className="nav-section-label">Workspace</p>
    <WorkspaceNavigation />
    <Button asChild className="sidebar-upload"><Link href="/uploads/new">Upload a file</Link></Button>
    <SidebarFooter />
  </aside>;
}
