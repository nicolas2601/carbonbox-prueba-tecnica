import Link from "next/link";

export function PageHeader({ title, description }: { title: string; description: string }) {
  return <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
    <div>
      <p className="mb-3 text-xs uppercase text-ink-muted">Activity ledger</p>
      <h1 className="page-title font-display">{title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{description}</p>
    </div>
    <Link className="button shrink-0" data-tone="primary" href="/uploads/new" prefetch={false}>
      <span aria-hidden="true" className="text-xl">+</span>Upload a file
    </Link>
  </header>;
}
