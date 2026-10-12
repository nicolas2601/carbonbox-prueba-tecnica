"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ErrorState";
import { useUploadStats, useUploads } from "./hooks";
import { RecentUploads } from "./RecentUploads";
import { ActivityCard } from "./dashboard/ActivityCard";
import { ACTIVITY_LIMIT } from "./dashboard/chartModels";
import { CompletionArcCard } from "./dashboard/CompletionArcCard";
import { LargestUploadsCard } from "./dashboard/LargestUploadsCard";
import { DashboardInsights } from "./dashboard/DashboardInsights";
import { Skeleton } from "@/components/ui/skeleton";
import type { UploadStats } from "@/lib/api/models";
import { numberFormatter } from "@/lib/format";
import "@/styles/dashboard.css";

function UploadTotals({ stats }: { stats: UploadStats }) {
  const totals = [["Total uploads", stats.total], ["Completed", stats.completed], ["In progress", stats.inProgress], ["Failed", stats.failed]] as const;
  return <div className="dashboard-totals">{totals.map(([label, count]) => <article key={label} aria-label={label}>
    <span>{label}</span><strong>{numberFormatter.format(count)}</strong>
  </article>)}</div>;
}
export function Dashboard() {
  const stats = useUploadStats();
  const recent = useUploads(1, ACTIVITY_LIMIT);
  return <div className="dashboard">
    <header className="dashboard-heading"><div><h1 className="page-title font-display">Your activity, in focus</h1>
      <p>A clear view of the files behind your emissions data.</p></div>
      <div className="dashboard-actions"><Link className="button" data-tone="primary" href="/uploads/new">Upload a file</Link>
        <Link className="button dashboard-secondary" href="/uploads">View uploads</Link></div>
    </header>
    {stats.data && <UploadTotals stats={stats.data} />}
    {stats.isPending && <div role="status" aria-label="Loading totals"><Skeleton className="dashboard-totals-placeholder" /></div>}
    {stats.isError && <ErrorState error={stats.error} onRetry={() => stats.refetch()} />}
    <div className="dashboard-zones"><div className="dashboard-content"><div className="dashboard-bento">
      <ActivityCard />
      {stats.data && <div className="dashboard-analysis-row"><CompletionArcCard stats={stats.data} /><LargestUploadsCard uploads={recent.data?.data} loading={recent.isPending} error={recent.error} onRetry={() => recent.refetch()} /></div>}
      {recent.isPending && <div className="dashboard-analysis-row"><Skeleton aria-hidden="true" className="bento-placeholder completion-arc-card" /><Skeleton aria-hidden="true" className="bento-placeholder largest-uploads-card" /></div>}
    </div><RecentUploads /></div>
      {stats.data && <DashboardInsights stats={stats.data} uploads={recent.data?.data} />}
      {stats.isPending && <aside aria-hidden="true" className="insight-rail"><Skeleton className="overview-skeleton" /></aside>}
    </div>
  </div>;
}
