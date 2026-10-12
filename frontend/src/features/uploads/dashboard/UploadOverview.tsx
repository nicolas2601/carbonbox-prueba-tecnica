import type { UploadStats } from "@/lib/api/models";
import { CountUp } from "@/components/react-bits/CountUp";
import { ApiStatus } from "@/components/navigation/ApiStatus";
import { Separator } from "@/components/ui/separator";
import { completionShare } from "./chartModels";
import { CompletionGauge } from "./LazyCharts";

const COUNTS = [{ key: "total", label: "Total uploads" }, { key: "completed", label: "Completed" },
  { key: "inProgress", label: "In progress" }, { key: "failed", label: "Failed" }] as const;
export function UploadOverview({ stats }: { stats: UploadStats }) {
  const percentage = completionShare(stats);
  return <><header><p className="rail-eyebrow">Upload overview</p><h2>Ready for review</h2></header>
    <div className="large-gauge" role="img" aria-label={`${percentage}% of uploads completed`}>
      <div aria-hidden="true" className="gauge-sweep"><CompletionGauge stats={stats} /></div>
      <div className="gauge-label"><strong className="font-display">{percentage}<span>%</span></strong><span>completion</span></div>
    </div><p className="rail-context">{stats.completed} completed / {stats.total} received</p>
    <Separator className="rail-separator" />
    <section aria-label="Upload totals" className="rail-counts">{COUNTS.map(item => <article key={item.key} aria-label={item.label}>
      <span><i aria-hidden="true" />{item.label}</span><strong><CountUp value={stats[item.key]} /><span className="sr-only">Count: {stats[item.key]}</span></strong>
    </article>)}</section>
    <div className="sr-only"><table><caption>Upload completion gauge values</caption><tbody><tr><th scope="row">Completed</th><td>{stats.completed}</td></tr><tr><th scope="row">Total</th><td>{stats.total}</td></tr></tbody></table></div>
    <div className="rail-api"><ApiStatus /></div>
  </>;
}
