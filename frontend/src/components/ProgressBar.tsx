export function ProgressBar({ label, value }: { label: string; value: number }) {
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-4 text-sm"><span>{label}</span><span className="font-mono tabular-nums">{value}%</span></div>
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span className="progress-fill" style={{ transform: `scaleX(${value / 100})` }} />
    </div>
  </div>;
}
