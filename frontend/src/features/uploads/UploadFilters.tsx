"use client";

import { useEffect, useRef, useState } from "react";
import type { UploadListFilters } from "@/lib/api/models";
import { Button } from "@/components/Button";
import { hasFilters } from "./listFilters";

const SEARCH_DELAY_MS = 300;
const MAX_SEARCH_LENGTH = 200;
const STATUSES = ["COMPLETED", "PROCESSING", "FAILED", "PENDING"];
const LABELS = ["Completed", "Processing", "Failed", "Pending"];
export function UploadFilters({ filters, onChange }: { filters: UploadListFilters; onChange: (filters: UploadListFilters) => void }) {
  const [query, setQuery] = useState(filters.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function apply(patch: UploadListFilters) { clearTimeout(timer.current); onChange({ ...filters, q: query.trim(), ...patch }); }
  function search(value: string) {
    setQuery(value); clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange({ ...filters, q: value.trim() }), SEARCH_DELAY_MS);
  }
  function clear() { clearTimeout(timer.current); setQuery(""); onChange({}); }
  return <form className="upload-filters" aria-label="Filter uploads" onSubmit={event => { event.preventDefault(); apply({ q: query.trim() }); }}>
    <label className="filter-search">Search filenames<input type="search" value={query} maxLength={MAX_SEARCH_LENGTH}
      placeholder="Find a CSV file" onChange={event => search(event.target.value)} /></label>
    <label>Status<select value={filters.status ?? ""} onChange={event => apply({ status: event.target.value })}>
      <option value="">All statuses</option>{STATUSES.map((status, index) => <option key={status} value={status}>{LABELS[index]}</option>)}
    </select></label>
    <label>Sort by<select value={filters.sort || "newest"} onChange={event => apply({ sort: event.target.value })}>
      <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Filename A–Z</option>
    </select></label>
    {hasFilters(filters) && <Button type="button" onClick={clear}>Clear filters</Button>}
  </form>;
}
