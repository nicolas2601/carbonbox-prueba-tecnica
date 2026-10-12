"use client";

import { useUploadStats } from "@/features/uploads/hooks";
import { ApiStatus } from "./ApiStatus";
import { CompletionIndicator } from "./CompletionIndicator";

export function SidebarFooter() {
  const stats = useUploadStats();
  return <div className="sidebar-footer">{stats.data && <CompletionIndicator stats={stats.data} />}<ApiStatus /></div>;
}
