"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ActivityPoint } from "./chartModels";
import { ActivityTooltip } from "./ActivityTooltip";

export function LargestUploadsChart({ points }: { points: ActivityPoint[] }) {
  return <ChartContainer config={{ rows: { label: "Rows handled", color: "var(--accent)" } }} className="aspect-auto h-full w-full">
    <BarChart data={points} layout="vertical" margin={{ top: 4, right: 4, bottom: 4, left: 4 }} accessibilityLayer={false}>
      <XAxis type="number" domain={[0, Math.max(1, ...points.map(point => point.rows))]} hide />
      <YAxis type="category" dataKey="id" hide />
      <ChartTooltip content={<ActivityTooltip />} isAnimationActive={false} />
      <Bar dataKey="rows" fill="var(--accent)" barSize={10} radius={4}
        background={{ fill: "var(--line)", radius: 4 }} isAnimationActive={false} />
    </BarChart>
  </ChartContainer>;
}
