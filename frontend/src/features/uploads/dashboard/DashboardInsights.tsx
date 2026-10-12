import type { Upload, UploadStats } from "@/lib/api/models";
import { numberFormatter } from "@/lib/format";
import { formatElapsed, medianElapsed, rowQuality } from "./insightModels";

const PERCENT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
function MetricTile({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="insight-tile" aria-label={label}><h2>{label}</h2><strong>{value}</strong><p>{note}</p></article>;
}
export function DashboardInsights({ stats, uploads }: { stats: UploadStats; uploads?: readonly Upload[] }) {
  const quality = rowQuality(stats);
  const median = uploads ? medianElapsed(uploads) : null;
  const queueNote = stats.pending !== undefined && stats.processing !== undefined
    ? `${stats.pending} pending / ${stats.processing} processing` : "Pending or processing files";
  return <aside className="insight-rail" aria-label="Dashboard metrics" data-surface="light">
    <MetricTile label="Rows handled" value={quality ? numberFormatter.format(quality.total) : "Not available"} note="Reported counters across all uploads" />
    <MetricTile label="Rejection rate" value={quality?.rejectionShare !== null && quality?.rejectionShare !== undefined
      ? `${PERCENT.format(quality.rejectionShare)}%` : "No row totals yet"} note="Rejected / handled rows across all uploads" />
    <MetricTile label="Median elapsed, approximate" value={median !== null ? formatElapsed(median) : uploads ? "No terminal files" : "Recent data unavailable"}
      note="Last 12 files. Includes queue time and retries." />
    <MetricTile label="Active uploads" value={numberFormatter.format(stats.inProgress)} note={queueNote} />
  </aside>;
}
