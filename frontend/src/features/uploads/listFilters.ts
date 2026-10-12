import type { UploadListFilters } from "@/lib/api/models";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined): string | undefined => Array.isArray(value) ? value[0] : value;
export function filtersFromSearchParams(params: SearchParams): UploadListFilters {
  return { q: first(params.q)?.trim(), status: first(params.status), sort: first(params.sort) };
}
export function hasFilters(filters: UploadListFilters): boolean {
  return Boolean(filters.q?.trim() || filters.status || (filters.sort && filters.sort !== "newest"));
}
export function uploadsUrl(page: number, filters: UploadListFilters = {}): string {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return `/uploads?${params.toString()}`;
}
export function filterKey(filters: UploadListFilters): string {
  return JSON.stringify([filters.q ?? "", filters.status ?? "", filters.sort ?? "newest"]);
}
