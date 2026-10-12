import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return <div role="status" aria-label="Loading totals" className="overview-skeleton">
    <span className="sr-only">Loading totals</span>
    <div aria-hidden="true"><Skeleton className="overview-heading" /><Skeleton className="overview-gauge" />
      <div className="overview-counts">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="overview-count-row" />)}</div>
    </div>
  </div>;
}
