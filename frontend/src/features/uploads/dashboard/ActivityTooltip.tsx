import type { ActivityPoint } from "./chartModels";
import { numberFormatter } from "@/lib/format";

interface Props { active?: boolean; payload?: readonly { payload?: ActivityPoint }[]; }
const STATUS = { PENDING: "Pending", PROCESSING: "Processing", COMPLETED: "Completed", FAILED: "Failed" };
export function ActivityTooltip({ active, payload }: Props) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="activity-tooltip">
    <p className="font-mono">{point.fileName}</p><p className="activity-tooltip-time">Received {point.time} UTC</p>
    {point.reported ? <dl>
      <div><dt>Processed</dt><dd>{numberFormatter.format(point.processed)}</dd></div>
      <div><dt>Rejected</dt><dd>{numberFormatter.format(point.rejected)}</dd></div>
      <div><dt>Rows handled</dt><dd>{numberFormatter.format(point.rows)}</dd></div>
    </dl> : <p>No rows reported yet</p>}
    <dl><div><dt>Status</dt><dd>{STATUS[point.status]}</dd></div></dl>
  </div>;
}
