import type { RowError } from "./types";

export function summarizeRowErrors(errors: RowError[], limit: number, total = errors.length): string | null {
  if (total === 0) return null;
  const cap = Number.isSafeInteger(limit) && limit >= 0 ? limit : 0;
  const details = errors.slice(0, cap).map(error => `line ${error.line}: ${error.field} - ${error.reason}`);
  const omitted = total - details.length;
  if (omitted > 0) details.push(`${omitted} more omitted`);
  return `${total} rows rejected. ${details.join("; ")}`;
}
