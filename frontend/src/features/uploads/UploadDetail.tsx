"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useUploadDetail } from "./hooks";
import { DetailHeader } from "./DetailHeader";
import { StatusPanel } from "./StatusPanel";
import { StatusTransition } from "./StatusTransition";

function DetailContent({ id, page }: { id: string; page: number }) {
  const query = useUploadDetail(id);
  if (query.isPending) return <><h1 className="sr-only">Upload detail</h1><Skeleton kind="table" /></>;
  if (query.isError && query.error.code === "UPLOAD_NOT_FOUND") {
    return <div className="state-card"><h1 className="font-display text-[28px]">Upload not found</h1>
      <p className="mt-3 text-sm text-ink-muted">This upload does not exist. Return to the list to choose another file.</p></div>;
  }
  if (query.isError) return <><h1 className="sr-only">Upload detail</h1><ErrorState error={query.error} onRetry={() => query.refetch()} /></>;
  return <div className="space-y-10">
    <p className="sr-only" role="status" aria-label="Upload status" aria-live="polite" aria-atomic="true">Upload {query.data.status.toLowerCase()}</p>
    <DetailHeader upload={query.data} />
    <StatusTransition upload={query.data} render={value => <StatusPanel upload={value} page={page} />} />
  </div>;
}
export function UploadDetail({ id, page }: { id: string; page: number }) {
  return <div className="space-y-6">
    <Link className="back-link" href="/uploads">Back to uploads</Link>
    <DetailContent id={id} page={page} />
  </div>;
}
