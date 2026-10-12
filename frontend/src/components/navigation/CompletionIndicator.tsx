import type { UploadStats } from "@/lib/api/models";
import { completionShare } from "@/features/uploads/dashboard/chartModels";

export function CompletionIndicator({ stats }: { stats: UploadStats }) {
  const percentage = completionShare(stats);
  return <div className="mini-completion">
    <div className="mini-ring" role="progressbar" aria-label="Completed upload share" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}
      >
      <svg viewBox="0 0 56 56" className="mini-ring-svg" aria-hidden="true">
        <circle cx="28" cy="28" r="23" fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle cx="28" cy="28" r="23" fill="none" stroke="var(--accent-strong)" strokeWidth="5" strokeLinecap="round"
          pathLength="100" strokeDasharray={`${percentage} 100`} transform="rotate(-90 28 28)" />
      </svg>
      <span className="mini-ring-value">{percentage}%</span>
    </div>
    <div><p className="text-xs font-medium">Completion</p><p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} uploads</p></div>
  </div>;
}
