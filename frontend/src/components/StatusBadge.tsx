"use client";

import type { UploadStatus } from "@/lib/api/models";
import { useVisibility } from "@/lib/useVisibility";

export function StatusBadge({ status }: { status: UploadStatus }) {
  const { ref, visible } = useVisibility<HTMLSpanElement>(status === "PROCESSING");
  return <span ref={ref} className="status-badge" data-status={status} data-visible={visible}>
    <span aria-hidden="true" className="status-dot" />
    {status[0] + status.slice(1).toLowerCase()}
  </span>;
}
