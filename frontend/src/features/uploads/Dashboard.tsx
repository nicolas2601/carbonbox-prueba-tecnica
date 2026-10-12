"use client";

import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { useUploadStats } from "./hooks";
import { RecentUploads } from "./RecentUploads";
import { ActivityCard } from "./dashboard/ActivityCard";
import { CompletionCard, StatusCard } from "./dashboard/CompletionCard";
import { LatestUpload } from "./dashboard/LatestUpload";
import { UploadOverview } from "./dashboard/UploadOverview";
import "@/styles/dashboard.css";

export function Dashboard() {
  const stats = useUploadStats();
  return <div className="dashboard">
    <PageHeader title="Your activity, in focus" description="A clear view of the files behind your emissions data." />
    <div className="dashboard-zones"><div className="dashboard-content"><div className="dashboard-bento">
      <ActivityCard />
      {stats.data && <><CompletionCard stats={stats.data} /><StatusCard stats={stats.data} /></>}
      <LatestUpload />
    </div><RecentUploads /></div>
      <aside className="graphite-panel dashboard-rail enter" data-surface="graphite" aria-label="Upload overview">
        {stats.isPending ? <Skeleton kind="stats" /> : stats.isError ? <ErrorState error={stats.error} onRetry={() => stats.refetch()} /> : <UploadOverview stats={stats.data} />}
      </aside>
    </div>
  </div>;
}
