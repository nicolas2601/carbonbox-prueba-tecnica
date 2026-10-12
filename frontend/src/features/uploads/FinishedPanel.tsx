"use client";

import { useRouter } from "next/navigation";
import type { Upload } from "@/lib/api/models";
import { ErrorState } from "@/components/ErrorState";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/Skeleton";
import { StatCard } from "@/components/StatCard";
import { useUploadResults } from "./hooks";
import { ResultTable } from "./ResultTable";
import { RESULTS_PAGE_SIZE } from "./pagination";
import { RejectedNotice } from "./RejectedNotice";

function ProcessedResults({ upload, page }: { upload: Upload; page: number }) {
  const router = useRouter();
  const rows = useUploadResults(upload.id, page, RESULTS_PAGE_SIZE, upload.status);
  if (rows.isPending) return <Skeleton kind="table" />;
  if (rows.isError) return <ErrorState error={rows.error} onRetry={() => rows.refetch()} />;
  return <div className="table-card" aria-busy={rows.isFetching}>
    <ResultTable result={rows.data} />
    <Pagination page={page} limit={RESULTS_PAGE_SIZE} total={rows.data.total} disabled={rows.isPlaceholderData}
      onPageChange={next => router.push(`/uploads/${encodeURIComponent(upload.id)}?page=${next}`, { scroll: false })} />
  </div>;
}
export function FinishedPanel({ upload, page }: { upload: Upload; page: number }) {
  return <section className="space-y-6">
    <h2 className="font-display text-[28px]">Processing complete</h2>
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Total rows" count={upload.totalRows ?? 0} />
      <StatCard label="Processed rows" count={upload.processedRows ?? 0} />
      <StatCard label="Rejected rows" count={upload.failedRows ?? 0} />
    </div>
    <RejectedNotice count={upload.failedRows ?? 0} summary={upload.errorMessage} />
    <ProcessedResults upload={upload} page={page} />
  </section>;
}
