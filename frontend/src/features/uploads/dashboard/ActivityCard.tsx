"use client";

import { ChartColumnStacked } from "lucide-react";
import { SpotlightCard } from "@/components/react-bits/SpotlightCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploads } from "../hooks";
import { ACTIVITY_LIMIT, activityPoints } from "./chartModels";
import { ActivityChart, LargestUploadsChart } from "./LazyCharts";
import { numberFormatter } from "@/lib/format";

export function ActivityCard() {
  const query = useUploads(1, ACTIVITY_LIMIT);
  const points = activityPoints(query.data?.data ?? []);
  return <SpotlightCard className="activity-card enter">
    <header className="bento-heading"><div><h2>Activity</h2><p>Rows in the last 12 uploads</p></div><ChartColumnStacked aria-hidden="true" size={20} /></header>
    {query.isPending ? <div role="status" aria-label="Loading activity" className="activity-plot"><Skeleton className="activity-skeleton" /></div> : query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : points.length === 0
      ? <EmptyState title="No activity yet" message="Your uploaded rows will appear here." />
      : <><div className="activity-plot" data-orientation={points.length <= 6 ? "horizontal" : "vertical"} style={{ "--file-count": points.length } as import("react").CSSProperties} role="img" aria-label={`Processed and rejected rows in the last 12 uploads, ${points.length} files. Values are in the following table.`}>
        <div aria-hidden="true" className="activity-chart">{points.length <= 6 ? <LargestUploadsChart points={points} orientation="horizontal" /> : <ActivityChart points={points} />}</div>
      </div><ul className="activity-legend" aria-label="Activity series"><li><i aria-hidden="true" />Processed</li><li><i aria-hidden="true" />Rejected</li><li>Time in UTC</li></ul>
      <div className="sr-only"><table><caption>Rows in the last 12 uploads</caption><thead><tr><th>File</th><th>Received</th><th>Processed</th><th>Rejected</th><th>Rows handled</th><th>Status</th></tr></thead>
        <tbody>{points.map(point => <tr key={point.id}><th scope="row">{point.fileName}</th><td>{point.date}</td>
          <td>{point.reported ? numberFormatter.format(point.processed) : "Not yet"}</td><td>{point.reported ? numberFormatter.format(point.rejected) : "Not yet"}</td>
          <td>{point.reported ? numberFormatter.format(point.rows) : "Not yet"}</td><td>{point.status === "PENDING" ? "Waiting" : point.status.toLowerCase()}</td></tr>)}</tbody>
      </table></div></>}
  </SpotlightCard>;
}
