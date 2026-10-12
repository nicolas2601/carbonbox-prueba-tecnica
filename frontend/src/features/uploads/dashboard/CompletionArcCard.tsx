"use client";

import type { UploadStats } from "@/lib/api/models";
import { Card } from "@/components/ui/card";
import { completionShare } from "./chartModels";
import { CompletionGauge } from "./LazyCharts";

export function CompletionArcCard({ stats }: { stats: UploadStats }) {
  const share = completionShare(stats);
  return <Card className="completion-arc-card">
    <header className="bento-heading"><div><h2>Completion</h2><p>Across all uploaded files</p></div></header>
    <div className="completion-arc" role="img" aria-label={`${share} percent of uploads completed`}>
      <div className="completion-arc-chart" aria-hidden="true"><CompletionGauge stats={stats} /></div>
      <strong>{share}%</strong>
    </div>
    <p className="completion-arc-fact">{stats.completed} of {stats.total} uploads completed</p>
  </Card>;
}
