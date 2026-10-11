import { Button } from "./Button";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  disabled?: boolean;
  onPageChange(page: number): void;
}
export function Pagination({ page, limit, total, disabled = false, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
    <p className="text-sm text-ink-muted tabular-nums">Page {page} of {pages}</p>
    <div className="flex gap-2">
      <Button disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
      <Button disabled={disabled || page >= pages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  </nav>;
}
