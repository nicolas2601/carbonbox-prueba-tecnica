"use client";

import { useId } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ActivityPoint } from "./chartModels";
import type { UploadStats } from "@/lib/api/models";
import { completionShare, statusCounts, formatRows } from "./chartModels";
import { ActivityTooltip } from "./ActivityTooltip";
import { FileAxisTick } from "./FileAxisTick";

const config = { processed: { label: "Processed", color: "var(--accent-strong)" }, rejected: { label: "Rejected", color: "var(--teal)" } };
function ActivityAxes({ points }: { points: ActivityPoint[] }) {
  return <><XAxis dataKey="id" axisLine={false} tickLine={false} minTickGap={12} tickMargin={8} height={48} fontSize={12}
    tickFormatter={id => points.find(point => point.id === id)?.shortName ?? ""} tick={<FileAxisTick points={points} />} />
    <YAxis width={56} axisLine={false} tickLine={false} allowDecimals={false} tickCount={4} tickFormatter={formatRows}
      tick={{ fill: "var(--text-muted)", fontSize: 12 }} /></>;
}
export function ActivityChart({ points }: { points: ActivityPoint[] }) {
  if (points.length === 0) return null;
  return <ChartContainer config={config} className="aspect-auto h-full w-full">
    <BarChart data={points} margin={{ top: 16, right: 16, bottom: 12, left: 12 }} maxBarSize={36} accessibilityLayer={false}>
      <ActivityAxes points={points} /><ChartTooltip cursor={false} content={<ActivityTooltip />} isAnimationActive={false} />
      <Bar dataKey="processed" name="Processed" stackId="rows" fill="var(--accent-strong)" isAnimationActive={false} />
      <Bar dataKey="rejected" name="Rejected" stackId="rows" fill="var(--teal)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ChartContainer>;
}
export function CompletionDonut({ stats }: { stats: UploadStats }) {
  const values = [{ value: stats.completed }, { value: stats.total - stats.completed || (stats.total === 0 ? 1 : 0) }];
  return <ChartContainer config={{ completed: { color: "var(--accent-strong)" } }}>
    <PieChart accessibilityLayer={false}><Pie data={values} dataKey="value" innerRadius="70%" outerRadius="95%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false} rootTabIndex={-1}>
      <Cell fill="var(--accent-strong)" /><Cell fill="var(--line)" />
    </Pie></PieChart>
  </ChartContainer>;
}
export function StatusBars({ stats }: { stats: UploadStats }) {
  const data = statusCounts(stats);
  return <ChartContainer config={{ count: { label: "Uploads" } }}>
    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 4, top: 4, bottom: 4 }} accessibilityLayer={false}>
      <XAxis type="number" domain={[0, Math.max(1, stats.total)]} hide /><YAxis type="category" dataKey="label" hide />
      <Bar dataKey="count" barSize={10} radius={5} background={{ fill: "var(--line)", radius: 5 }} isAnimationActive={false}>
        {data.map(item => <Cell key={item.label} fill={item.fill} />)}
      </Bar>
    </BarChart>
  </ChartContainer>;
}
export function CompletionGauge({ stats }: { stats: UploadStats }) {
  const id = useId().replaceAll(":", "");
  return <ChartContainer config={{ completed: { color: "var(--accent)" } }}>
    <RadialBarChart data={[{ value: completionShare(stats) }]} innerRadius="82%" outerRadius="100%" startAngle={220} endAngle={-40} accessibilityLayer={false}>
      <defs><linearGradient id={id}><stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--accent-2)" /></linearGradient></defs>
      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
      <RadialBar dataKey="value" fill={`url(#${id})`} background={{ fill: "var(--graphite-2)" }} cornerRadius={12} isAnimationActive={false} />
    </RadialBarChart>
  </ChartContainer>;
}
