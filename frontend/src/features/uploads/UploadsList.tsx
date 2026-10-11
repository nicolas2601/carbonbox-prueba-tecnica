"use client";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { Pagination } from "@/components/Pagination";
import { useRouter } from "next/navigation";
import { useUploads } from "./hooks";
import { UPLOADS_PAGE_SIZE } from "./pagination";
import { UploadsTable } from "./UploadsTable";

function UploadsContent({ page }: { page: number }) {
  const router = useRouter();
  const uploads = useUploads(page, UPLOADS_PAGE_SIZE);
  if (uploads.isPending) return <Skeleton kind="table" />;
  if (uploads.isError) return <ErrorState error={uploads.error} onRetry={() => uploads.refetch()} />;
  if (!uploads.data.data.length) return <EmptyState title="No uploads yet" message="Start your activity ledger with a CSV file." />;
  return <div className="table-card" aria-busy={uploads.isFetching}>
    <span className="sr-only" aria-live="polite">{uploads.isFetching ? "Updating uploads" : "Uploads loaded"}</span>
    <UploadsTable uploads={uploads.data.data} caption="All uploads" detailed />
    <Pagination page={page} limit={UPLOADS_PAGE_SIZE} total={uploads.data.total} disabled={uploads.isPlaceholderData}
      onPageChange={next => router.push(`/uploads?page=${next}`, { scroll: false })} />
  </div>;
}
export function UploadsList({ page }: { page: number }) {
  return <div className="space-y-10">
    <PageHeader title="Uploads" description="Every file, from the queue to a completed record." />
    <UploadsContent page={page} />
  </div>;
}
