"use client";

import { useEffect, useRef, useState } from "react";
import type { UploadStatus } from "@/lib/api/models";

export function StatusBadge({ status }: { status: UploadStatus }) {
  const badge = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (status !== "PROCESSING" || !badge.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => { setVisible(entries[0]?.isIntersecting ?? false); });
    observer.observe(badge.current);
    return () => observer.disconnect();
  }, [status]);
  return <span ref={badge} className="status-badge" data-status={status} data-visible={visible}>
    <span aria-hidden="true" className="status-dot" />
    {status[0] + status.slice(1).toLowerCase()}
  </span>;
}
