"use client";

import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ActivityPoint } from "./chartModels";
import type { UploadStats } from "@/lib/api/models";
import { completionShare, statusCounts } from "./chartModels";

const config = { rows: { label: "Rows handled", color: "var(--accent-strong)" } };
export function ActivityChart({ points }: { points: ActivityPoint[] }) {
  const id = useId().replaceAll(":", "");
  return <ChartContainer config={config}>
    <AreaChart data={points} margin={{ top: 20, right: 12, bottom: 0, left: -28 }} accessibilityLayer={false}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} /><stop offset="65%" stopColor="var(--accent-2)" stopOpacity={0.12} /><stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
      </linearGradient><clipPath id={`${id}-reveal`}><rect width="100%" height="100%" className="area-reveal-mask" /></clipPath></defs>
      <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={32} tickMargin={12} />
      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
      <ChartTooltip content={<ChartTooltipContent />} isAnimationActive={false} />
      <g clipPath={`url(#${id}-reveal)`}><Area type="monotone" dataKey="rows" name="Rows handled" stroke="var(--accent-strong)" strokeWidth={2.5} fill={`url(#${id})`} isAnimationActive={false} /></g>
    </AreaChart>
  </ChartContainer>;
}
export function CompletionDonut({ stats }: { stats: UploadStats }) {
  const values = [{ value: stats.completed }, { value: stats.total - stats.completed || (stats.total === 0 ? 1 : 0) }];
  return <ChartContainer config={{ completed: { color: "var(--accent-strong)" } }}>
    <PieChart accessibilityLayer={false}><Pie data={values} dataKey="value" innerRadius="70%" outerRadius="95%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
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
