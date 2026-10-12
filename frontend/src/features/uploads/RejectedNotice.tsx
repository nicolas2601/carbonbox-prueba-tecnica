import { numberFormatter } from "@/lib/format";
import { CircleAlert } from "lucide-react";

export function RejectedNotice({ count, summary }: { count: number; summary: string | null }) {
  if (!count) return null;
  const lines = summary?.match(/line \d+:[\s\S]*/)?.[0].split(/;\s*/).slice(0, 10) ?? [];
  return <aside role="note" aria-label="Rejected rows" className="rejected-notice space-y-3">
    <CircleAlert aria-hidden="true" size={22} />
    <h3 className="text-sm font-semibold">{numberFormatter.format(count)} {count === 1 ? "row" : "rows"} rejected</h3>
    <p className="text-sm">Valid rows were kept. Rejected rows are not included in the results below.</p>
    {lines.length > 0 && <ul className="list-disc pl-5 space-y-2 text-xs font-mono break-words">
      {lines.map((line, index) => <li key={index}>{line}</li>)}
    </ul>}
  </aside>;
}
