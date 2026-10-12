## Why

Analysts need truthful per-file charts, a searchable server-backed upload ledger
and a practical intake workspace. Smoothed activity curves imply nonexistent
peaks, repeated dates hide file identity and unfiltered pagination cannot find
older records. This refinement preserves Carbon Day while improving those tasks.

## What Changes

- Always use stacked processed/rejected bars per upload, short filename/time
  labels, compact numeric axes and complete tooltips/accessibility alternatives.
- Add server-side filename search, status filtering and stable sorting with URL
  state and a 300 ms input debounce; update OpenAPI and real PostgreSQL tests.
- Compact the intake surface, add required-column/rule/sample guidance and recent
  uploads, show a real transfer row and a server-backed accepted-file state.
- Add a dashboard-only graphite stage with orange/teal charts, completion arc,
  largest-upload bars and observed-row/rejection/approximate-duration/active-file
  tiles. Other pages remain light; the white sidebar gets reference-style context.
- Add a quiet recent-upload section below desktop navigation, retaining completion
  and readiness indicators.
- Replace the basic PROCESSING panel with actual handled rows, observed approximate
  rows/second between polls and elapsed time since receipt, without invented phases.

## Capabilities

### New Capabilities
- `upload-search`: validated server-side filtering/sorting and URL-driven ledger
- `upload-workspace`: guidance, sample download, recent files and transfer row
- `dashboard-insights`: scoped row quality and approximate elapsed-time views
- `sidebar-context`: recent files without additional chart dependencies
- `processing-readout`: observed processing rate/elapsed time with unknown-total semantics

### Modified Capabilities
- `dashboard-layout`: per-upload stacked activity bars instead of smoothed areas
- `upload-page`: accepted uploads stay visible with a detail link instead of an automatic redirect
- `upload-detail-page`: informative processing readout instead of decorative progress geometry

## Impact

Backend list-query validation, persistence, HTTP schema/OpenAPI and tests; frontend
dashboard/list/upload/navigation, design contract and E2E/capture fixtures. No
schema migration, auth, storage-driver or queue change. Delivery is timeboxed to
2026-10-12 12:30 America/Bogota; incomplete work will be explicitly deferred.

The coordinator reassigned upload-page/sidebar implementation to worker2 in its
own worktree. This session owns charts, filters, hydration, dashboard stage and
PROCESSING detail. Global processed/rejected row sums and pending/processing
counts extend the existing stats endpoint so labels never imply global totals
computed from one list page.
