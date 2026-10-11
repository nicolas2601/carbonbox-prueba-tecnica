"use client";

import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useUploads } from "./hooks";
import { UploadsTable } from "./UploadsTable";

const RECENT_LIMIT = 5;

export function RecentUploads() {
  const uploads = useUploads(1, RECENT_LIMIT);
  return <section aria-labelledby="recent-title" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="recent-title" className="font-display text-[28px]">Recent uploads</h2>
      <Link href="/uploads" className="inline-flex min-h-10 items-center text-sm text-accent underline underline-offset-4">View all uploads</Link>
    </div>
    {uploads.isPending ? <Skeleton kind="table" /> : uploads.isError
      ? <ErrorState error={uploads.error} onRetry={() => uploads.refetch()} />
      : uploads.data.data.length === 0
        ? <EmptyState title="No uploads yet" message="Start your activity ledger with a CSV file." />
        : <div className="table-card"><UploadsTable uploads={uploads.data.data.slice(0, RECENT_LIMIT)} caption="Recent uploads" /></div>}
  </section>;
}
