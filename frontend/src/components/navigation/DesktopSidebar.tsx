import Link from "next/link";
import { Lockup } from "@/components/brand/LogoMark";
import { WorkspaceNavigation } from "./WorkspaceNavigation";
import { SidebarFooter } from "./SidebarFooter";

export function DesktopSidebar() {
  return <aside className="desktop-sidebar">
    <Link href="/" aria-label="CarbonBox home" className="sidebar-brand"><Lockup /></Link>
    <p className="nav-section-label">Workspace</p>
    <WorkspaceNavigation />
    <SidebarFooter />
  </aside>;
}
