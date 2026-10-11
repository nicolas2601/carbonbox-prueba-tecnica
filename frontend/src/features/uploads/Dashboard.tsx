"use client";

import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { StatCard } from "@/components/StatCard";
import { useUploadStats } from "./hooks";

const CARDS = [
  { key: "total", label: "Total uploads", detail: "Files received" },
  { key: "completed", label: "Completed", detail: "Ready for review" },
  { key: "inProgress", label: "In progress", detail: "Queued or processing" },
  { key: "failed", label: "Failed", detail: "Need attention" },
] as const;

function UploadTotals() {
  const stats = useUploadStats();
  if (stats.isPending) return <Skeleton kind="stats" />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;
  return <section aria-labelledby="totals-title">
    <h2 id="totals-title" className="sr-only">Upload totals</h2>
    <div className="stats-grid">{CARDS.map(card =>
      <StatCard key={card.key} label={card.label} count={stats.data[card.key]} detail={card.detail} />)}</div>
  </section>;
}
export function Dashboard() {
  return <div className="space-y-10">
    <PageHeader title="Your activity, in focus" description="A clear view of the files behind your emissions data." />
    <UploadTotals />
  </div>;
}
