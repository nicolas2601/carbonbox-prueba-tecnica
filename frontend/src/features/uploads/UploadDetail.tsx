"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useUploadDetail } from "./hooks";
import { DetailHeader } from "./DetailHeader";
import { ActivePanel } from "./ActivePanel";
import { StatusTransition } from "./StatusTransition";

function DetailContent({ id }: { id: string }) {
  const query = useUploadDetail(id);
  if (query.isPending) return <><h1 className="sr-only">Upload detail</h1><Skeleton kind="table" /></>;
  if (query.isError && query.error.code === "UPLOAD_NOT_FOUND") {
    return <div className="state-card"><h1 className="font-display text-[28px]">Upload not found</h1>
      <p className="mt-3 text-sm text-ink-muted">This upload does not exist. Return to the list to choose another file.</p></div>;
  }
  if (query.isError) return <><h1 className="sr-only">Upload detail</h1><ErrorState error={query.error} onRetry={() => query.refetch()} /></>;
  return <div className="space-y-10">
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">Upload {query.data.status.toLowerCase()}</p>
    <DetailHeader upload={query.data} />
    <StatusTransition upload={query.data} render={value => <ActivePanel upload={value} />} />
  </div>;
}
export function UploadDetail({ id, page }: { id: string; page: number }) {
  return <div className="space-y-6" data-page={page}>
    <Link className="back-link" href="/uploads">Back to uploads</Link>
    <DetailContent id={id} />
  </div>;
}
