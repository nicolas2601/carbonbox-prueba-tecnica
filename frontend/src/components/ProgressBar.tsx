"use client";

import { useVisibility } from "@/lib/useVisibility";

export function ProgressBar({ label, value, detail }: { label: string; value?: number; detail?: string }) {
  const indeterminate = value === undefined;
  const { ref, visible } = useVisibility<HTMLDivElement>(indeterminate);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{label}</span><span className="font-mono tabular-nums">{indeterminate ? detail : `${value}%`}</span></div>
    <div ref={ref} className="progress-track" role="progressbar" aria-label={label} aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100} aria-valuenow={value} data-indeterminate={indeterminate} data-visible={visible}>
      <span className="progress-fill" style={indeterminate ? undefined : { transform: `scaleX(${value / 100})` }} />
    </div>
  </div>;
}
