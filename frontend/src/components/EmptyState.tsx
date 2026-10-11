import Link from "next/link";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="state-card">
    <h2 className="font-display text-[28px]">{title}</h2>
    <p className="mt-3 text-sm text-ink-muted">{message}</p>
    <Link className="button mt-6" data-tone="primary" href="/uploads/new">Upload a file</Link>
  </div>;
}
