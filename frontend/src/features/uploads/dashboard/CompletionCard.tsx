import type { UploadStats } from "@/lib/api/models";
import { Card } from "@/components/ui/card";
import { CompletionDonut, StatusBars } from "./LazyCharts";
import { completionShare, statusCounts } from "./chartModels";

export function CompletionCard({ stats }: { stats: UploadStats }) {
  const percentage = completionShare(stats);
  return <Card className="completion-card enter">
    <header className="bento-heading"><h2>Completion</h2></header>
    <div className="completion-fact"><div className="small-donut" role="img" aria-label={`${percentage}% completed`}>
      <div aria-hidden="true" className="donut-chart"><CompletionDonut stats={stats} /></div><span aria-hidden="true">{percentage}%</span>
    </div><p>{stats.completed} of {stats.total} uploads completed</p></div>
    <div className="sr-only"><table><caption>Completion values</caption><tbody><tr><th scope="row">Completed</th><td>{stats.completed}</td></tr><tr><th scope="row">Total</th><td>{stats.total}</td></tr></tbody></table></div>
  </Card>;
}
export function StatusCard({ stats }: { stats: UploadStats }) {
  const counts = statusCounts(stats);
  return <Card className="status-card enter">
    <header className="bento-heading"><h2>File status</h2></header>
    <div className="status-bars-layout"><dl>{counts.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.count}</dd></div>)}</dl>
      <div className="bars-chart" role="img" aria-label={counts.map(item => `${item.label}: ${item.count}`).join(", ")}><div aria-hidden="true"><StatusBars stats={stats} /></div></div>
    </div><div className="sr-only"><table><caption>File status counts</caption><tbody>{counts.map(item => <tr key={item.label}><th scope="row">{item.label}</th><td>{item.count}</td></tr>)}</tbody></table></div>
  </Card>;
}
