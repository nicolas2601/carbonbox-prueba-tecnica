import type { ActivityPoint } from "./chartModels";

interface Props { x?: number; y?: number; payload?: { value?: string }; points: readonly ActivityPoint[]; }
export function FileAxisTick({ x = 0, y = 0, payload, points }: Props) {
  const point = points.find(item => item.id === payload?.value);
  if (!point) return null;
  return <text x={x} y={y + 14} textAnchor="middle" fill="var(--text-muted)" fontSize={12}>
    <tspan x={x}>{point.shortName}</tspan><tspan x={x} dy={16}>{point.time}</tspan>
  </text>;
}
