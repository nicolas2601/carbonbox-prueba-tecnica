import { CountUp } from "./react-bits/CountUp";
import { numberFormatter } from "@/lib/format";

export function StatCard({ label, count, detail }: { label: string; count: number; detail?: string }) {
  return <article aria-label={label} className="stat-card enter">
    <h3 className="text-sm text-ink-muted">{label}</h3>
    <p className="stat-figure"><CountUp value={count} className="font-display tabular-nums" /><span className="sr-only">Count: {numberFormatter.format(count)}</span></p>
    <div aria-hidden="true" className="stat-rule" />
    {detail && <p className="mt-3 text-xs text-ink-muted">{detail}</p>}
  </article>;
}
