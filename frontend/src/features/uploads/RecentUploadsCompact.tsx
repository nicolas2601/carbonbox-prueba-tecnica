"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { dateFormatter } from "@/lib/format";
import { useUploads } from "./hooks";

const RECENT_LIMIT = 3;

export function RecentUploadsCompact() {
  const uploads = useUploads(1, RECENT_LIMIT);
  return <section className="recent-uploads-compact" aria-labelledby="upload-recent-title">
    <div className="recent-uploads-heading">
      <h2 id="upload-recent-title">Recent uploads</h2>
      <Link href="/uploads" className="canvas-link">View all</Link>
    </div>
    {uploads.isPending ? <Skeleton kind="table" /> : uploads.isError
      ? <ErrorState error={uploads.error} onRetry={() => uploads.refetch()} />
      : uploads.data.data.length === 0
        ? <p className="recent-uploads-empty">Your recent uploads will appear here.</p>
        : <ul className="recent-upload-list">
          {uploads.data.data.slice(0, RECENT_LIMIT).map(upload => <li key={upload.id}>
            <Link href={`/uploads/${encodeURIComponent(upload.id)}`} className="recent-upload-link">
              <span className="recent-upload-name" title={upload.fileName}>{upload.fileName}</span>
              <StatusBadge status={upload.status} />
              <time dateTime={upload.createdAt}>{dateFormatter.format(new Date(upload.createdAt))}</time>
            </Link>
          </li>)}
        </ul>}
  </section>;
}
