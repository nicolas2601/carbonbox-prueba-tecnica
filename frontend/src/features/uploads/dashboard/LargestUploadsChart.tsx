"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import type { LabelFormatter } from "recharts/types/component/Label";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ActivityPoint } from "./chartModels";
import { ActivityTooltip } from "./ActivityTooltip";
import { formatRows } from "./chartModels";
import { FileAxisTick } from "./FileAxisTick";

interface FullNameTickProps { x?: number; y?: number; payload?: { value?: string }; points: readonly ActivityPoint[]; }
const labelRows: LabelFormatter = value => typeof value === "number" ? formatRows(value) : "";
function FullNameTick({ x = 0, y = 0, payload, points }: FullNameTickProps) {
  const point = points.find(item => item.id === payload?.value);
  if (!point) return null;
  return <text x={x} y={y + 4} textAnchor="end" fill="var(--on-graphite-muted)" fontSize={12}>{point.fileName}</text>;
}
const CONFIG = {
  processed: { label: "Processed", color: "var(--accent)" },
  rejected: { label: "Rejected", color: "var(--teal)" },
};

export function LargestUploadsChart({ points, orientation = "vertical" }: { points: ActivityPoint[]; orientation?: "vertical" | "horizontal" }) {
  if (orientation === "horizontal") return <ChartContainer config={CONFIG} className="aspect-auto h-full w-full activity-horizontal">
    <BarChart data={points} layout="vertical" margin={{ top: 8, right: 44, bottom: 8, left: 8 }} barCategoryGap={8} accessibilityLayer={false}>
      <XAxis type="number" tickFormatter={formatRows} tick={{ fill: "var(--on-graphite-muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
      <YAxis type="category" dataKey="id" width={140} interval={0} tick={<FullNameTick points={points} />} tickLine={false} axisLine={false} />
      <ChartTooltip content={<ActivityTooltip />} isAnimationActive={false} />
      <Bar dataKey="processed" name="Processed" stackId="rows" fill="var(--accent)" maxBarSize={24} isAnimationActive={false} />
      <Bar dataKey="rejected" name="Rejected" stackId="rows" fill="var(--teal)" maxBarSize={24} isAnimationActive={false}>
        <LabelList dataKey="rows" position="right" formatter={labelRows} fill="var(--on-graphite)" fontSize={12} />
      </Bar>
    </BarChart>
  </ChartContainer>;
  return <ChartContainer config={CONFIG} className="aspect-auto h-full w-full">
    <BarChart data={points} margin={{ top: 16, right: 16, bottom: 12, left: 12 }} maxBarSize={24} accessibilityLayer={false}>
      <XAxis dataKey="id" axisLine={false} tickLine={false} minTickGap={12} tickMargin={8} height={48} fontSize={12}
        tickFormatter={id => points.find(point => point.id === id)?.shortName ?? ""} tick={<FileAxisTick points={points} />} />
      <YAxis width={56} axisLine={false} tickLine={false} allowDecimals={false} tickCount={4} tickFormatter={formatRows} tick={{ fill: "var(--on-graphite-muted)", fontSize: 12 }} />
      <ChartTooltip content={<ActivityTooltip />} isAnimationActive={false} />
      <Bar dataKey="processed" name="Processed" stackId="rows" fill="var(--accent)" maxBarSize={24} isAnimationActive={false}>
        <LabelList dataKey="rows" position="top" formatter={labelRows} fill="var(--on-graphite)" fontSize={12} />
      </Bar>
      <Bar dataKey="rejected" name="Rejected" stackId="rows" fill="var(--teal)" maxBarSize={24} isAnimationActive={false} radius={[4, 4, 0, 0]} />
    </BarChart>
  </ChartContainer>;
}
