"use client";

import Link from "next/link";
import type { Upload } from "@/lib/api/models";
import type { ApiError } from "@/lib/api/ApiError";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { numberFormatter, compactNumberFormatter } from "@/lib/format";
import { activityPoints, activitySummary } from "./chartModels";
import { latestRejectionShare, largestUploads } from "./insightModels";
import { LargestUploadsChart } from "./LazyCharts";

export function LargestUploadsCard({ uploads = [], loading = false, error, onRetry }: {
  uploads?: readonly Upload[]; loading?: boolean; error?: ApiError | null; onRetry?: () => void;
}) {
  const activity = activityPoints(uploads);
  const observed = activity.some(point => point.reported);
  const points = largestUploads(uploads);
  const summary = activitySummary(activity);
  const latestRejection = latestRejectionShare(activity);
  return <Card className="largest-uploads-card">
    <header className="bento-heading"><div><h2>Activity detail</h2><p>Rows handled in the last 12 uploads</p></div></header>
    {observed && <dl className="activity-summary" aria-label="Observed rows in the last 12 uploads">
      <div><dt>Processed</dt><dd>{numberFormatter.format(summary.processed)}</dd></div>
      <div><dt>Rejected</dt><dd>{numberFormatter.format(summary.rejected)}</dd></div>
      <div><dt>Rejection rate</dt><dd>{summary.rejectionShare === null ? "No row totals yet" : `${compactNumberFormatter.format(summary.rejectionShare).toLowerCase()}%`}</dd></div>
    </dl>}
    {loading ? <div role="status" aria-label="Loading activity details"><Skeleton className="largest-skeleton" /></div>
      : error ? onRetry ? <ErrorState error={error} onRetry={onRetry} /> : <p role="alert">Recent files unavailable. Reload to retry.</p>
      : points.length === 0 ? <p className="insight-empty">{observed ? "No uploads have handled rows yet" : "No row totals available yet"}</p>
      : <>
      <div className="activity-insights">
      <ul aria-label="Largest recent uploads">{points.map(point => <li key={point.id} data-point-id={point.id}>
          <Link href={`/uploads/${encodeURIComponent(point.id)}`} title={point.fileName}>{point.fileName}</Link>
          <span>{numberFormatter.format(point.rows)}</span>
        </li>)}</ul>
      <div className="largest-chart" aria-hidden="true"><LargestUploadsChart points={points} orientation={points.length <= 6 ? "horizontal" : "vertical"} /></div>
      </div>
      <p className="activity-insight">{summary.largest ? <>Largest upload: <Link href={`/uploads/${encodeURIComponent(summary.largest.id)}`}>{summary.largest.fileName}</Link>, {numberFormatter.format(summary.largest.rows)} rows</> : "No ranked upload available yet"}
        {latestRejection === null ? ". Latest upload rejection rate not available yet." : `. Latest upload: ${compactNumberFormatter.format(latestRejection).toLowerCase()}% rejected.`}</p></>}
  </Card>;
}
