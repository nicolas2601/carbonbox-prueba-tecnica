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
import type { UploadListFilters } from "@/lib/api/models";
import { UploadFilters } from "./UploadFilters";
import { filterKey, hasFilters, uploadsUrl } from "./listFilters";
import { Button } from "@/components/Button";
import "@/styles/filters.css";

function FilteredEmpty({ filters, onClear }: { filters: UploadListFilters; onClear: () => void }) {
  return <div className="state-card filtered-empty"><h2 className="font-display text-[28px]">No matching uploads</h2>
    <p>{filters.q ? <>No filenames match <strong>{filters.q}</strong> with these filters.</> : "No files match this status and order."}</p>
    <Button onClick={onClear}>Show all uploads</Button></div>;
}
function UploadsContent({ page, filters }: { page: number; filters: UploadListFilters }) {
  const router = useRouter();
  const uploads = useUploads(page, UPLOADS_PAGE_SIZE, filters);
  if (uploads.isPending) return <Skeleton kind="table" />;
  if (uploads.isError) return <ErrorState error={uploads.error} onRetry={() => uploads.refetch()} />;
  if (uploads.data.total === 0) return hasFilters(filters)
    ? <FilteredEmpty filters={filters} onClear={() => router.replace(uploadsUrl(1), { scroll: false })} />
    : <EmptyState title="No uploads yet" message="Start your activity ledger with a CSV file." />;
  if (!uploads.data.data.length) return <div className="state-card"><h2>No uploads on this page</h2>
    <p>Try the first page with these filters.</p><Button onClick={() => router.replace(uploadsUrl(1, filters), { scroll: false })}>Go to first page</Button></div>;
  return <div className="table-card" aria-busy={uploads.isFetching}>
    <span className="sr-only" aria-live="polite">{uploads.isFetching ? "Updating uploads" : "Uploads loaded"}</span>
    <UploadsTable uploads={uploads.data.data} caption={hasFilters(filters) ? "Matching uploads" : "All uploads"} detailed />
    <Pagination page={page} limit={UPLOADS_PAGE_SIZE} total={uploads.data.total} disabled={uploads.isPlaceholderData}
      onPageChange={next => router.push(uploadsUrl(next, filters), { scroll: false })} />
  </div>;
}
export function UploadsList({ page, filters = {} }: { page: number; filters?: UploadListFilters }) {
  const router = useRouter();
  return <div className="space-y-10">
    <PageHeader title="Uploads" description="Every file, from the queue to a completed record." />
    <UploadFilters key={filterKey(filters)} filters={filters} onChange={next => router.replace(uploadsUrl(1, next), { scroll: false })} />
    <UploadsContent page={page} filters={filters} />
  </div>;
}
