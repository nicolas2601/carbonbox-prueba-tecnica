import { Skeleton as BaseSkeleton } from "./ui/skeleton";

const COUNTS = { stats: 4, table: 5 };
const LABELS = { stats: "Loading totals", table: "Loading uploads" };

export function Skeleton({ kind }: { kind: "stats" | "table" }) {
  return <div role="status" aria-label={LABELS[kind]} className="loading-skeleton" data-kind={kind}>
    <span className="sr-only">{LABELS[kind]}</span>
    <div aria-hidden="true" className="skeleton-grid">
      {Array.from({ length: COUNTS[kind] }, (_, index) => <div key={index} className="skeleton-row">
        <BaseSkeleton className="skeleton-label" /><BaseSkeleton className="skeleton-value" /><BaseSkeleton className="skeleton-rule" />
      </div>)}
    </div>
  </div>;
}
