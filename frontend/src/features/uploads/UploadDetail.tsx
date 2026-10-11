"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useUploadDetail } from "./hooks";
import { DetailHeader } from "./DetailHeader";

function DetailContent({ id }: { id: string }) {
  const query = useUploadDetail(id);
  if (query.isPending) return <><h1 className="sr-only">Upload detail</h1><Skeleton kind="table" /></>;
  if (query.isError && query.error.code === "UPLOAD_NOT_FOUND") {
    return <div className="state-card"><h1 className="font-display text-[28px]">Upload not found</h1>
      <p className="mt-3 text-sm text-ink-muted">This upload does not exist. Return to the list to choose another file.</p></div>;
  }
  if (query.isError) return <><h1 className="sr-only">Upload detail</h1><ErrorState error={query.error} onRetry={() => query.refetch()} /></>;
  return <DetailHeader upload={query.data} />;
}
export function UploadDetail({ id, page }: { id: string; page: number }) {
  return <div className="space-y-6" data-page={page}>
    <Link className="back-link" href="/uploads">Back to uploads</Link>
    <DetailContent id={id} />
  </div>;
}
