"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useId } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: ReactNode; color?: string }>;
interface ChartContainerProps extends ComponentProps<"div"> {
  config: ChartConfig;
  children: ComponentProps<typeof ResponsiveContainer>["children"];
}

// Adapted from shadcn/ui (MIT). The application ships one theme and token-only colors.
export function ChartContainer({ config, children, className, style, ...props }: ChartContainerProps) {
  const id = useId();
  const colors = Object.fromEntries(Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]));
  return <div data-slot="chart" data-chart={id} className={cn("carbon-chart", className)}
    style={{ ...colors, ...style } as CSSProperties} {...props}>
    <ResponsiveContainer initialDimension={{ width: 480, height: 240 }}>{children}</ResponsiveContainer>
  </div>;
}

export const ChartTooltip = Tooltip;
interface TooltipEntry { name?: string | number; value?: number | string | readonly (number | string)[]; color?: string; }
export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: readonly TooltipEntry[]; label?: ReactNode }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip">
    {label && <p className="text-xs font-medium">{label}</p>}
    {payload.map((item, index) => <p key={index} className="flex items-center justify-between gap-4 text-xs">
      <span>{item.name}</span><span className="font-mono tabular-nums">{String(item.value ?? 0)}</span>
    </p>)}
  </div>;
}
