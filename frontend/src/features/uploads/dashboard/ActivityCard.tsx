"use client";

import { TrendingUp } from "lucide-react";
import { SpotlightCard } from "@/components/react-bits/SpotlightCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploads } from "../hooks";
import { ACTIVITY_LIMIT, activityPoints } from "./chartModels";
import { ActivityChart } from "./LazyCharts";

export function ActivityCard() {
  const query = useUploads(1, ACTIVITY_LIMIT);
  const points = activityPoints(query.data?.data ?? []);
  return <SpotlightCard className="activity-card enter">
    <header className="bento-heading"><div><h2>Activity</h2><p>Rows in the last 12 uploads</p></div><TrendingUp aria-hidden="true" size={20} /></header>
    {query.isPending ? <div role="status" aria-label="Loading activity" className="activity-plot"><Skeleton className="activity-skeleton" /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : points.length === 0
      ? <EmptyState title="No activity yet" message="Your uploaded rows will appear here." />
      : <><div className="activity-plot" role="img" aria-label={`Rows in the last 12 uploads, ${points.length} uploads. Values are in the following table.`}>
        <svg className="ridge-landscape" viewBox="0 0 800 240" preserveAspectRatio="none" aria-hidden="true"><path d="M0 220 120 166 180 180 280 72 330 96 400 20 510 126 610 65 700 151 800 120 800 240 0 240Z" fill="var(--accent)" fillOpacity="0.06" /></svg>
        <div aria-hidden="true" className="chart-reveal"><ActivityChart points={points} /></div>
      </div><table className="sr-only"><caption>Rows in the last 12 uploads</caption><thead><tr><th>File</th><th>Date</th><th>Rows handled</th><th>Status</th></tr></thead>
        <tbody>{points.map(point => <tr key={point.id}><th scope="row">{point.fileName}</th><td>{point.label}</td><td>{point.rows}</td><td>{point.status === "PENDING" ? "Waiting" : point.status.toLowerCase()}</td></tr>)}</tbody>
      </table></>}
  </SpotlightCard>;
}
