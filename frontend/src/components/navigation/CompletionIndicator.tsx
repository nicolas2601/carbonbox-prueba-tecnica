import type { UploadStats } from "@/lib/api/models";
import { completionShare } from "@/features/uploads/dashboard/chartModels";

export function CompletionIndicator({ stats }: { stats: UploadStats }) {
  const percentage = completionShare(stats);
  const rows = [
    ["Uploads", stats.total], ["Completed", stats.completed],
    ["In progress", stats.inProgress], ["Failed", stats.failed],
    ...(stats.processedRows === undefined ? [] : [["Rows processed", stats.processedRows] as const]),
    ...(stats.rejectedRows === undefined ? [] : [["Rows rejected", stats.rejectedRows] as const]),
  ] as const;
  const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  return <section className="sidebar-stats" aria-label="Upload statistics">
    <div className="sidebar-stats-top">
      <div className="sidebar-ring" role="progressbar" aria-label="Completed upload share" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <svg viewBox="0 0 96 96" className="sidebar-ring-svg" aria-hidden="true">
          <circle cx="48" cy="48" r="41" fill="none" stroke="var(--graphite-2)" strokeWidth="7" />
          <circle cx="48" cy="48" r="41" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
            pathLength="100" strokeDasharray={`${percentage} 100`} transform="rotate(-90 48 48)" />
        </svg>
        <span className="sidebar-ring-value">{percentage}%</span>
      </div>
      <div><p className="sidebar-stats-eyebrow">Completion</p><p className="sidebar-stats-summary">{stats.completed} of {stats.total} uploads</p></div>
    </div>
    <dl className="sidebar-kpis">
      {rows.map(([label, count]) => <div className="sidebar-kpi" key={label}>
        <dt>{label}</dt><dd>{compact.format(count)}</dd>
      </div>)}
    </dl>
  </section>;
}
